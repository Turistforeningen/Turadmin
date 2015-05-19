/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');

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

    var makeRequest = function (path, req, res, onCompleteOverride, getAll) {
        var API_LIMIT = 50;
        var PROXY_LIMIT = 200;

        // Strip query params from path to get URL
        var url = ntbApiUri + path.split('?')[0];

        // Set the approperiate method if overridden using _method
        var method = req.body._method || req.method;
        delete req.body._method;

        // Create options object and set API key
        var options = options || {};
        options.query = req.query || {};
        options.query.api_key = ntbApiKey;

        // Apply query params from passed path to query object
        // The URL-params will override existing req params with matching keys
        var paramsStr = path.split('?')[1];
        var paramsArr = paramsStr.split('&');

        for (var i = 0, key, val; i < paramsArr.length; i++) {
            key = paramsArr[i].split('=')[0];
            val = paramsArr[i].split('=')[1] || "";
            options.query[key] = val;
        }

        // Callbacks
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
            options.headers = {'User-Agent': 'turadmin-v2.0'};

            // Adds support for a higher limit than the one set in NTB API, but not higher than internal PROXY_LIMIT
            // Will sequentially perform the number of requests necessary for collecting the number of objects
            // set in the custom limit.
            if (options.query.limit > API_LIMIT) {
                var customLimit = Math.min(options.query.limit, PROXY_LIMIT);
                options.query.limit = API_LIMIT;

                var skip = 0; // Number of objects to skip. This will increase for each request
                var all = []; // Array that will eventually contain objects from all requests

                var prepData = function (data, response) {

                    if (data.documents && data.documents.length) {
                        for (var i = 0; i < data.documents.length; i++) {
                            if (all.length < customLimit) {
                                all.push(data.documents[i]);
                            }
                        }

                        if ((all.length === data.total) || (all.length >= customLimit)) {
                            onComplete({documents: all, count: all.length, total: data.total}, response);

                        } else {
                            options.query = options.query || {};
                            skip += data.count;
                            options.query.skip = skip;

                            restler.get(url, options).on('complete', prepData);
                        }

                    } else {
                        onComplete(data, response);
                    }
                };

                restler.get(url, options).on('complete', prepData);

            } else {
                restler.get(url, options).on('complete', onComplete);
            }

        } else if (method === "POST") {
            // console.log("Posting:", util.inspect(req.body));
            options = {headers: {'User-Agent': 'turadmin-v2.0'}};
            restler.postJson(url, req.body, options).on('complete', onCompletePost);

        } else if (method === "PUT") {
            options = {data: JSON.stringify(req.body), headers: {}};
            options.headers['content-type'] = 'application/json';
            options.headers['User-Agent'] = 'turadmin-v2.0';
            // console.log("PUT url:", url);
            // console.log("PUT options:", options);
            restler.put(url, options).on('complete', onComplete);

        } else if (method === "PATCH") {
            options = {data: JSON.stringify(req.body), headers: {}};
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
        if (req.query && req.query.gruppe) {
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
