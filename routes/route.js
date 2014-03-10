
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

            var routeData = data;

            var picturesCount = (!!data.bilder) ? data.bilder.length : 0;
            var picturesData = [];

            var poisCount = (!!data.steder) ? data.steder.length : 0;
            var poisData = [];

            var additionalResourcesCount = picturesCount; // TODO: Add poisCount

            var onCompletePictureRequest = function (data) {
                picturesData.push(data);
                doRender();
            };

            var onCompletePoiRequest = function (data) {
                poisData.push(data);
                doRender();
            };

            for (var i = 0; i < picturesCount; i++) {
                var pictureId = data.bilder[i];
                restProxy.makeApiRequest('/bilder/' + pictureId, 'GET', undefined, onCompletePictureRequest);
            }

            for (var j = 0; j < poisCount; j++) {
                var poiId = data.steder[j];
                restProxy.makeApiRequest("/steder/" + poiId, 'GET', undefined, onCompletePoiRequest);
            }

            var doRender = underscore.after(additionalResourcesCount, function(){

                res.render('route', {
                    pageTitle: data.navn,
                    routeApiUri: options.routeApiUri,
                    routeName: routeData.navn,
                    routeData: JSON.stringify(routeData),
                    picturesData: JSON.stringify(picturesData)
                    // poisData: poisData
                });
            });

        };

        restProxy.makeApiRequest("/turer/" + turId, 'GET', undefined, onCompleteTurRequest);

    };

    app.get('/tur', route);
    app.get('/tur/:id', routeEdit);

};
