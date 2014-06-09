/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (router) { // TODO: Pass router instead of app as argument in app.js
    "use strict";

    var gm = require('gm').subClass({imageMagick: true});
    var dms2dec = require('dms2dec');
    var path = require('path');
    var fs = require('fs');
    var _ = require('underscore');

    var ntbApi = require('./restProxy')(router, {ntbApiUri: process.env.NTB_API_URL, ntbApiKey: process.env.NTB_API_KEY});

    var options = {
        tmpDir: '/tmp', // tmp dir to upload files to
        uploadDir: '/tmp', // actual location of the file
        uploadUrl: '/uploads/', // end point for delete route
        maxPostSize: 11000000000, // 11 GB
        minFileSize: 1,
        maxFileSize: 10000000000, // 10 GB
        acceptFileTypes: /.+/i,
        inlineFileTypes: /\.(gif|jpe?g|png)/i,
        imageTypes:  /\.(gif|jpe?g|png)/i,
        accessControl: {
            allowOrigin: '*',
            allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
            allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
        },
        storage : {
            type : 'local' // local or aws
        }
    };

    var uploader = require('blueimp-file-upload-expressjs')(options);

    var s3Uploader = require('s3-uploader');

    var s3Client = new Upload('turadmin', {
        awsBucketUrl: 'https://s3-eu-west-1.amazonaws.com/turadmin/',
        awsBucketPath: process.env.AWS_BUCKET_PATH + '/',
        awsBucketAcl: 'public-read',
        versions: [
            {
                original: true
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


    // Return image path based on file upload module options and image name
    var getImagePath = function (image) {
        return path.join(options.uploadDir, image.name);
    };

    // Returns an image object with `geojson` property appended if image has gps info
    var getImagePosition = function (image, callback) {

        var imagePath = getImagePath(image);

        gm(imagePath).identify(function (err, value) {

            if (value['Properties']) {
                var lat = value['Properties']['exif:GPSLatitude'];
                var latRef = value['Properties']['exif:GPSLatitudeRef'];
                var lon = value['Properties']['exif:GPSLongitude'];
                var lonRef = value['Properties']['exif:GPSLongitudeRef'];

                if (!!lat && !!latRef && !!lon && !!lonRef) {
                    var dec = dms2dec(lat, latRef, lon, lonRef),
                        decLat = dec[0],
                        decLon = dec[1];

                    image.geojson = {
                        type: 'Point',
                        coordinates: [decLon, decLat]
                    };

                }
            }

            callback(err, image);

        });

    };

    var uploadImageToS3 = function (image, callback) {

        var imagePath = getImagePath(image);

        s3Client.upload(imagePath, function (err, images, exifData) {
            if (err) {
                console.error('Error when uploading picture to S3', err);
                callback(err, images);
            } else {
                fs.unlink(imagePath);
                callback(err, images);
            }
        });

    };

    var saveToNasjonalturbase = function (picture, callback) {

        // Need a request object for the ntbApi proxy
        var request = {
            method: 'POST',
            body: picture
        };

        ntbApi.makeApiRequest('/bilder', request, undefined, function (data, result) {
            var err = (result instanceof Error === true) ? result : undefined; // https://github.com/danwrong/restler#events see `complete: function(result, response)`
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

    router.post('/upload/picture', function(req, res) {
      uploader.post(req, res, function (obj) {
        getImagePosition(obj.files[0], function (err, image) {
            uploadImageToS3(image, function (err, images) {

                var originalImage = _.findWhere(images, {original: true});

                var picture = {img: [], geojson: image.geojson};
                picture.img = _.without(images, originalImage);
                picture.img.push(originalImage);

                saveToNasjonalturbase(picture, function (err, picture) {
                    res.send(JSON.stringify({files: [picture]})); // Wrapping image in files object and array to match jQuery uploader plugin format
                });
            });
        });
      });
    });

    return router;

};
