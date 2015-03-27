/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

sentry = require('../lib/sentry');

module.exports = function (app, options) {
    "use strict";

    var ntbApiUri = options.ntbApiUri;
    var ntbApiKey = options.ntbApiKey;
    var restler = require('restler');
    var underscore = require('underscore');
    var util = require('util');

    /*
        Move id from document object to _id on result object, to update client side model with id.
     */
    var moveId = function (data) {
        if (data.document && data.document._id) {
            data._id = data.document._id;
        } else {
            sentry.captureMessage('ID is missing in result after post!', {extra: {data: data}});
        }
        data.document = undefined;
    };

    var makeRequest = function (path, req, res, onCompleteOverride) {
        var apiKey = (path.match(/\?/) ? '&' : '?') + 'api_key=' + ntbApiKey;
        var url = ntbApiUri + path + apiKey;
        var method = req.body._method || req.method;
        delete req.body._method;
        var json, options;

        // console.log("Request URL:", url);

        var onCompleteDefault = function (data, response) {
            res.statusCode = (!!response) ? response.statusCode : 0;
            if (data.document !== undefined) { // NOTE: Why the if?
                data.document = undefined;
            }
            res.json(data);
        };

        var onComplete = onCompleteOverride || onCompleteDefault;

        var onCompletePost = function (data, response) {
            if (!!response && !!response.statusCode) {
                res.statusCode = response.statusCode;
            }
            // console.log("Response:", data);
            moveId(data);
            res.json(data);
        };

        onCompletePost = onCompleteOverride || onCompletePost;

        var onCompletePostGpx = function (data, gpx) {
            data = underscore.extend(data, gpx);
            onCompletePost(data);
        };

        if (method === "GET") {
            options = {headers: {'User-Agent': 'turadmin-v2.0'}};
            restler.get(url, options).on('complete', onComplete);

        } else if (method === "POST") {
            // console.log("Posting:", util.inspect(req.body));
            options = {headers: {'User-Agent': 'turadmin-v2.0'}};
            restler.postJson(url, req.body, options).on('complete', onCompletePost);

        } else if (method === "PUT") {
            json = JSON.stringify(req.body);
            options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            options.headers['User-Agent'] = 'turadmin-v2.0';
            // console.log("PUT url:", url);
            // console.log("PUT options:", options);
            restler.put(url, options).on('complete', onComplete);

        } else if (method === "PATCH") {
            json = JSON.stringify(req.body);
            options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            options.headers['User-Agent'] = 'turadmin-v2.0';
            // console.log("DEBUG:restproxy: PATCH", url);
            // console.log("PATCH options:", options);
            restler.patch(url, options).on('complete', onComplete);

        } else if (method === "DELETE") {
            // console.log("DELETE url:", url);
            options = {headers: {'User-Agent': 'turadmin-v2.0'}};
            restler.del(url, options).on('complete', onComplete);
        }
    };

    app.get('/restProxy/turer', function (req, res, next) {
        if (req.query && req.query['gruppe']) {
            res.cookie('userDefaultRouteFetchQuery_' + req.session.userId, {
                'gruppe': req.query.gruppe
            }, {
                signed: true,
                maxAge: 2628000000
            });

        } else if ((req.session.authType == 'dnt-connect') && (req.query && req.query['privat.opprettet_av.id'])) {
            res.cookie('userDefaultRouteFetchQuery_' + req.session.userId, {
                'privat.opprettet_av.id': req.query['privat.opprettet_av.id']
            }, {
                signed: true,
                maxAge: 2628000000
            });
        }
        next();
    });

    app.all('/restProxy/*', function (req, res) {
        var path = req.url;
        path = path.replace('restProxy/', '');
        makeRequest(path, req, res);
    });

    return {makeApiRequest: makeRequest};
};
