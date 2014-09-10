/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (router) { // TODO: Pass router instead of app as argument in app.js
    "use strict";

    var async = require('async');
    var JFUM = require('jfum');
    var Upload = require('s3-uploader');
    var dms2dec = require('dms2dec');

    var ntbApi = require('./restProxy')(router, {ntbApiUri: process.env.NTB_API_URL, ntbApiKey: process.env.NTB_API_KEY});
    var jfum = new JFUM({
        minFileSize: 1,       // 200 kB
        maxFileSize: 6000000  // 5 mB
    });
    var s3Client = new Upload('turadmin', {
        awsBucketUrl: 'https://s3-eu-west-1.amazonaws.com/turadmin/',
        awsBucketPath: process.env.AWS_BUCKET_PATH,
        awsBucketAcl: 'public-read',
        awsHttpTimeout: 10000,
        asyncLimit: 1,
        returnExif: true,

        versions: [
            {
                original: true,
                awsImageAcl: 'private'
            },
            {
                maxHeight: 1040,
                maxWidth: 1040,
                suffix: '-large',
                quality: 80
            },
            {
                maxHeight: 780,
                maxWidth: 780,
                suffix: '-medium'
            },
            {
                maxHeight: 320,
                maxWidth: 320,
                suffix: '-small'
            }
        ]
    });

    var getImagePosition = function (exif) {
        var lat = exif['exif:GPSLatitude'],
            latRef = exif['exif:GPSLatitudeRef'],
            lon = exif['exif:GPSLongitude'],
            lonRef = exif['exif:GPSLongitudeRef'];

        if (!!lat && !!latRef && !!lon && !!lonRef) {
            var dec = dms2dec(lat, latRef, lon, lonRef),
                decLat = dec[0],
                decLon = dec[1];

            return {
                type: 'Point',
                coordinates: [decLon, decLat]
            };
        }
    };

    var saveToNasjonalturbase = function (picture, callback) {
        // Need a request object for the ntbApi proxy
        var request = {
            method: 'POST',
            body: picture
        };

        ntbApi.makeApiRequest('/bilder', request, undefined, function (data, result) {
            // https://github.com/danwrong/restler#events see `complete: function(result, response)`
            var err = (result instanceof Error === true) ? result : null;
            if (err) {
                console.error('Error when saving picture to Nasjonal Turbase', err);
            } else {
                picture._id = data.document._id;
            }
            callback(err, picture);
        });

    };


    /**
     * Routes
     */

    router.options('/upload/picture', jfum.optionsHandler.bind(jfum));
    router.post('/upload/picture', jfum.postHandler.bind(jfum), function(req, res, next) {
        console.log('POST /upload/picture');
        console.log(req.jfum);

        req.setTimeout(300000)

        if (req.jfum.error) { return next(new Error(jfum.error)); }

        async.mapSeries(req.jfum.files, function(image, cb) {
            if (image.errors.length > 0) {
                console.error(image.errors);
                return process.nextTick(async.apply(cb, null, {err: image.errors[0].message, src: image}));
            }

            // Resize and upload image to S3
            s3Client.upload(image.path, {}, function(err, image, meta) {
                if (err) { return cb(err); }
                if (!image) { return cb(new Error('No image returned from s3-uploader')); }

                var geojson;

                // Remove original image
                image = image.splice(1);

                // Check and get image geoposition
                if (meta && meta.exif) {
                    geojson = getImagePosition(meta.exif);
                }

                // Post image to Nasjonal Turbase
                saveToNasjonalturbase({img: image, geojson: geojson}, cb);
            });

        }, function(err, images) {
            if (err) { return next(err); }
            res.json({files: images});
        });
    });

    return router;

};
