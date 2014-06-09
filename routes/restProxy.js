/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    var ntbApiUri = options.ntbApiUri;
    var ntbApiKey = options.ntbApiKey;
    var pictureFileManager = options.pictureFileManager;
    var restler = require('restler');
    var underscore = require('underscore');
    var util = require('util');

    /*
        Move picture to permanent storage using jquery-file-upload-middleware'filehandler
     */
    var movePicture = function (req, picture) {
        var status = {ok: true, error: ""};
        var userId = req.session.userId;
        pictureFileManager.movePictureToPermanentStorage(picture.url, userId, function (error, result) {

            if (!error && !!result) {
                picture.url = result.url;
                picture.thumbnailUrl = result.thumbnailUrl;

                underscore.each(picture.img, function (image) {
                    //is thumbnail if width and height is set
                    if (!!image.width && !!image.height) {
                        image.url = result.thumbnailUrl;
                    } else {
                        image.url = result.url;
                    }
                });

                console.log("moved picture: ", picture);

            } else {
                status.error = 'Error moving file to permanent storage';
                status.ok = false;
                console.error(status.error);
            }
        });
        return status;
    };

    /*
        Move id from document object to _id on result object, to update client side model with id.
     */
    var moveId = function (data) {
        if (data.document && data.document._id) {
            data._id = data.document._id;
        } else {
            console.error('id is missing in result after post!');
        }
        data.document = undefined;
    };

    var makeRequest = function (path, req, res, onCompleteOverride) {
        var apiKey = (path.match(/\?/) ? '&' : '?') + 'api_key=' + ntbApiKey;
        var url = ntbApiUri + path + apiKey;
        var method = req.method;
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
            console.log("Response:", data);
            moveId(data);
            res.json(data);
        };

        var onCompletePostPicture = function (data, picture) {
            data = underscore.extend(data, picture);
            onCompletePost(data);
        };

        var onCompletePostGpx = function (data, picture) {
            data = underscore.extend(data, picture);
            onCompletePost(data);
        };

        if (method === "GET") {
            // console.log("getUrl = " + url);
            restler.get(url, {})
                .on('complete', onComplete);

        } else if (method === "POST") {
            console.log("Posting:", util.inspect(req.body));

            //Move pictures to permanent storage when saving to rest api. Updates results object with new urls.
            if (path.indexOf("bilder") > -1) {
                var result = movePicture(req, req.body);
                var resultOk = result.ok;
                var error = result.error;
                if (resultOk) {
                    restler.postJson(url, req.body)
                        .on('complete', function (data) {
                            onCompletePostPicture(data, req.body);
                        });
                } else {
                    restler.abort(error);
                }

            } else {
                restler.postJson(url, req.body)
                    .on('complete', onCompletePost);
            }

        } else if (method === "PUT") {
            json = JSON.stringify(req.body);
            options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            // console.log("PUT url:", url);
            // console.log("PUT options:", options);
            restler.put(url, options).on('complete', onComplete);

        } else if (method === "PATCH") {
            json = JSON.stringify(req.body);
            options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            // console.log("PATCH url:", url);
            // console.log("PATCH options:", options);
            restler.patch(url, options).on('complete', onComplete);

        } else if (method === "DELETE") {
            // console.log("DELETE url:", url);
            restler.del(url, {})
                .on('complete', onComplete);
        }
    };

    app.get('/restProxy/turer', function (req, res, next) {
        if (req.query && req.query.gruppe) {
            res.cookie('userLastUsedGroup', req.query.gruppe, {signed: true, maxAge: 2628000000});
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
