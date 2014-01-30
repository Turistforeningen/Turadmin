
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

    upload.configure({
        imageVersions: {
            thumbnail: {
                width: width,
                height: height
            }
        }
    });

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

    /*
        Register fileHandler to listen to /uploads and to store images on server
     */
    app.use('/upload', function (req, res, next) {
        upload.fileHandler({
            uploadDir: function () {
                return options.dirname + '/public/uploads/' + req.sessionID;
            },
            uploadUrl: function () {
                return '/uploads/' + req.sessionID;
            }
        })(req, res, next);
    });

    app.use('/upload', express.bodyParser());
};


