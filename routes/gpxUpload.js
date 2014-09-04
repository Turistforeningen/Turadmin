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
        minFileSize: 1,       // 200 kB
        maxFileSize: 5242880, // 5 mB
        acceptFileTypes: /\.(gpx)$/i
    });

    app.options('/upload/gpx', jfum.optionsHandler.bind(jfum));

    app.post('/upload/gpx', jfum.postHandler.bind(jfum), function(req, res, next) {
        console.log('GPX file uploaded');
        console.log(req.jfum);

        // JFUM error
        if (req.jfum.error) {
            var error = req.jfum.error || 'Ukjent feil ved opplasting av fil.';
            return res.status(500).send({error: error});
        }

        // No files uploaded
        if (req.jfum.files.length === 0) {
            return res.status(400).send({error: "Ingen fil ble lastet opp."});
        }

        var file = req.jfum.files[0];

        // Uploaded file had error
        if (file.errors.length !== 0) {
            return res.status(400).send({error: file.errors[0].message });
        }

        // Pars uploaded file
        fs.readFile(file.path, {encoding: 'utf-8'}, function(err, data) {
            return res.status(200).send(togeojson.gpx(jsdom(fs.readFileSync(file.path, 'utf8'))));
        });
    });
};
