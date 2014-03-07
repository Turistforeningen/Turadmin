
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, restProxy, options) {
    "use strict";

    var underscore = require('underscore');

    /*
     * GET add new route page.
     */
    var route = function (req, res) {
        req.session.userId = "testUserId";
        res.render('route', { title: 'Opprett ny tur', routeApiUri: options.routeApiUri });
    };

    var routeEdit = function (req, res) {

        var turId = req.params.id;

        req.session.userId = "testUserId";

        // TODO: Fix dynamic URL
        var url = 'http://localhost:3000/restProxy/turer/' + turId;

        var onCompleteTurRequest = function (data) {

            var picturesCount = data.bilder.length;
            var picturesData = [];

            // var poisCount = data.steder.length;
            // var poisData = [];

            var additionalResourcesCount = picturesCount; // TODO: Add poisCount

            var onCompletePictureRequest = function (data) {
                picturesData.push(data);
                doRender();
            };

            // var onCompletePoiRequest = function (data) {
            //     poisData.push(data);
            //     doRender();
            // };

            for (var i = 0; i < picturesCount; i++) {
                var pictureId = data.bilder[i];
                restProxy.makeApiRequest('/bilder/' + pictureId, 'GET', undefined, onCompletePictureRequest);
            }

            // for (var i = 0; i < poisCount; i++) {
            //     var poiId = data.steder[i];
            //     restProxy.makeApiRequest("/steder/" + poiId, 'GET', undefined, doRender);
            // }

            var doRender = underscore.after(additionalResourcesCount, function(){
                res.render('route', {
                    pageTitle: data.navn,
                    routeApiUri: options.routeApiUri,
                    turData: data,
                    picturesData: picturesData
                    // poisData: poisData
                });
            });

        };

        restProxy.makeApiRequest("/turer/" + turId, 'GET', undefined, onCompleteTurRequest);

    };

    app.get('/tur', route);
    app.get('/tur/:id', routeEdit);

};
