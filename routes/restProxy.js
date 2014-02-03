/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    var ntbApiUri = options.ntbApiUri;
    var ntbApiKey = options.ntbApiKey;
    var fileManager = options.fileManager;
    var restler = require('restler');
    var underscore = require('underscore');
    var util = require('util');


    /*
        Move picture to permanent storage using jquery-file-upload-middleware'filehandler
     */
    var movePicture = function (req, picture) {
        var result = {ok: true, error: ""};
        var userId = req.session.userId;
        fileManager.movePictureToPermanentStorage(picture.url, userId, function (error, result) {

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
                result.error = "Error moving file to permanent storage";
                result.ok = false;
                console.error(result.error);
            }
        });
        return result;
    };

    /*
        Move id from document object to _id on result object, to update client side model with id.
     */
    var moveId = function (data) {
        if (data.document && data.document._id) {
            data._id = data.document._id;
        } else {
            console.error("id is missing in result after post!");
        }
        data.document = undefined;
    };

    app.all('/restProxy/*', function (req, res) {
        var path = req.url;
        path = path.replace("restProxy/", "");
        var apiKey = "?api_key=" + ntbApiKey;
        var url = ntbApiUri + path + apiKey;
        console.log("url " + url);

        var onComplete = function (data) {
            console.log(data);
            if (data.document !== undefined) {
                data.document = undefined;
            }
            res.json(data);
        };

        var onCompletePost = function (data) {
            console.log("Response: ", data);
            moveId(data);
            res.json(data);
        };

        var onCompletePostPicture = function (data, picture) {
            data = underscore.extend(data, picture);
            onCompletePost(data);
        };

        var method = req.method;

        if (method === "GET") {
            console.log("getUrl = " + url);
            restler.get(url, {})
                .on('complete', onComplete);

        } else if (method === "POST") {
            console.log("Posting: " + util.inspect(req.body));

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
            var json = JSON.stringify(req.body);
            console.log("putUrl = " + url);
            var options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            restler.put(url, options)
                .on('complete', onComplete);

        } else if (method === "DELETE") {
            console.log("Deleting: " + url);
            restler.del(url, {})
                .on('complete', onComplete);
        }
    });
};

