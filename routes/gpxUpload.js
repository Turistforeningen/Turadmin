/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, express, options) {
    "use strict";

    var upload = require('jquery-file-upload-middleware');
    var underscore = require('underscore');
    var togeojson = require('togeojson');
    var fs = require('fs');
    var jsdom = require('jsdom').jsdom; // node doesn't have xml parsing or a dom. use jsdom

    var createOptions = function (userId) {
        return {
            uploadDir: function () {
                return options.dirname + '/public/uploads/' + userId + '/tmp';
            },
            uploadUrl: function () {
                return '/uploads/' + userId + '/tmp';
            }
        };
    };

    /**
     * Register fileHandler to listen to /uploads and to store images on server
     */
    app.use('/upload/gpx', function (req, res, next) {
        var options = createOptions(req.session.userId);
        var fileHandler = upload.fileHandler(options);
        fileHandler(req, res, next);
    });

    app.use('/upload/gpx', express.bodyParser());

    // When upload is done, convert gpx file to GeoJSON using togeojson
    upload.on('end', function (fileInfo) {

        if (!!fileInfo && !!fileInfo.name && fileInfo.name.match(/\.gpx/)) {

            console.log(fileInfo);

            // var uploadDir = createOptions(req.session.userId).uploadDir();
            var uploadDir = createOptions('testUserId').uploadDir();

            var gpxFileContents = jsdom(fs.readFileSync(uploadDir + '/' + fileInfo.name, 'utf8'));
            var converted = togeojson.gpx(gpxFileContents);

            underscore.extend(fileInfo, converted);

        }

    });

};
