
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, express, options) {
    "use strict";

    var upload = require('jquery-file-upload-middleware');
    var underscore = require('underscore');
    var width = 380;
    var height = 260;
    var createOptions =  function (userId) {
        return {
            uploadDir: function () {
                return options.dirname + '/public/uploads/' + userId + '/tmp';
            },
            uploadUrl: function () {
                return '/uploads/' + userId + '/tmp';
            }
        };
    };

    upload.configure({
        imageVersions: {
            thumbnail: {
                width: width,
                height: height
            }
        }
    });

    /*
        Register fileHandler to listen to /uploads and to store images on server
     */
    app.use('/upload', function (req, res, next) {
        var options = createOptions(req.session.userId);
        var fileHandler = upload.fileHandler(options);
        fileHandler(req, res, next);
    });

    app.use('/upload', express.bodyParser());

    /*
     Listen to end processing event and change fileInfo object to match Nasjonal Turbase Bilde API, and client side backbone Picture-model.
     */
    upload.on('end', function (fileInfo) {
        var res = {
            navn: fileInfo.originalName,

            img: [
                {
                    url: fileInfo.url,
                    size: fileInfo.size,
                    type: fileInfo.type
                },
                {
                    url: fileInfo.thumbnailUrl,
                    width:  width,
                    height: height,
                    type: fileInfo.type

                }
            ]
        };
        var prop;
        for (prop in fileInfo) {
            if (fileInfo.hasOwnProperty(prop)) {
                delete fileInfo[prop];
            }
        }

        underscore.extend(fileInfo, res);

    });

    var movePictureToPermanentStorage = function (url, userId, cb) {
        var options = createOptions(userId);
        var fileManager = upload.fileManager(options);
        fileManager.move(url, "../permanent", function (error, result) {
            result.url = result.url.replace("tmp/../", "");
            result.thumbnailUrl = result.thumbnailUrl.replace("tmp/../", "");
            cb(error, result);
        });
    };

    return {movePictureToPermanentStorage: movePictureToPermanentStorage};
};


