/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (router) {
    "use strict";

    var gm = require('gm').subClass({imageMagick: true});
    var dms2dec = require('dms2dec');
    var path = require('path');
    var fs = require('fs');
    var _ = require('underscore');

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
            console.log('s3Client.upload(err, images, exifData)', err, images, exifData);
            if (err) {
                callback(err, images);
            } else {
                fs.unlink(imagePath);
                callback(err, images);
            }
        });

    };


    /**
     * Routes
     */

    router.get('/upload/picture', function(req, res) {
      uploader.get(req, res, function (obj) {
            res.send(JSON.stringify(obj));
      });
    });

    router.post('/upload/picture', function(req, res) {
      uploader.post(req, res, function (obj) {
        getImagePosition(obj.files[0], function (err, image) {
            uploadImageToS3(image, function (err, images) {

                var original = _.findWhere(images, {original: true});
                var resized = _.without(images, original);
                resized.push(original);

                res.send(JSON.stringify({files: [{img: resized, geojson: image.geojson}]})); // Wrapping image in files object and array to match jQuery uploader plugin format
            });
        });
      });
    });

    // the path SHOULD match options.uploadUrl
    router.delete('/uploaded/files/:name', function(req, res) {
      uploader.delete(req, res, function (obj) {
            res.send(JSON.stringify(obj));
      });
    });

    return router;

};
