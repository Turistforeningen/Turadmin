/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, express, options) {
    "use strict";

    var bodyParser = require('body-parser');
    var underscore = require('underscore');
    var togeojson = require('togeojson');
    var fs = require('fs');
    var jsdom = require('jsdom').jsdom;
    var JFUM = require('jfum');

    var jfum = new JFUM({
        tmpDir: '/tmp',
        minFileSize: 204800,  // 200 kB
        maxFileSize: 5242880, // 5 mB
        acceptFileTypes: /\.(gpx)$/i
    });

    app.options('/upload/gpx', jfum.optionsHandler.bind(jfum));

    app.post('/upload/gpx', jfum.postHandler.bind(jfum), function(req, res, next) {

        var file = req.jfum.files[0];

        if (typeof file === 'object' && typeof file.error === 'undefined') {

            var gpxFileContents = jsdom(fs.readFileSync(file.path, 'utf8'));
            var geoJson = togeojson.gpx(gpxFileContents);

            res.status(200).send(geoJson);

        } else {
            // the file was rejected or not uploaded correctly
            // error message will be in req.jfum.error
            res.status(500).send({error: req.jfum.error});

        }

    });
};
