
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, restProxy, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;

    /*
     * GET add new route page.
     */
    var route = function (req, res, next) {

        var userGroups = req.userGroups || [];

        var renderOptions = {
            title: 'Opprett ny tur',
            routeApiUri: options.routeApiUri,
            userGroups: JSON.stringify(userGroups)
        };

        req.session.userId = 'testUserId';
        res.render('route', renderOptions);
    };

    var routeEdit = function (req, res, next) {

        var userGroups = req.userGroups || [];

        var turId = req.params.id;

        req.session.userId = 'testUserId';

        // TODO: Fix dynamic URL
        var url = 'http://localhost:3000/restProxy/turer/' + turId;

        var onCompleteTurRequest = function (data) {

            // console.log('Route was fetched.');

            var routeData = data;

            var picturesCount = (!!data.bilder) ? data.bilder.length : 0;
            var picturesData = [];

            // console.log('Route has', picturesCount, 'pictures.');

            var poisCount = (!!data.steder) ? data.steder.length : 0;
            var poisData = [];

            // console.log('Route has', poisCount, 'pois.');

            var totalResourcesCount = picturesCount + poisCount + 1; // +1 is the route

            // console.log('Route has', totalResourcesCount, 'total resources including route.');

            var onCompletePictureRequest = function (data) {
                picturesData.push(data);
                allResourcesLoaded();
            };

            var onCompletePoiRequest = function (data) {
                poisData.push(data);
                allResourcesLoaded();
            };

            // console.log('Fetching', picturesCount, 'pictures...');
            for (var i = 0; i < picturesCount; i++) {
                var pictureId = data.bilder[i];
                restProxy.makeApiRequest('/bilder/' + pictureId, req, undefined, onCompletePictureRequest);
            }
            // console.log('Done!');

            // console.log('Fetching', poisCount, 'pois...');
            for (var j = 0; j < poisCount; j++) {
                var poiId = data.steder[j];
                restProxy.makeApiRequest('/steder/' + poiId, req, undefined, onCompletePoiRequest);
            }
            // console.log('Done!');

            var allResourcesLoaded = underscore.after(totalResourcesCount, function () {

                // console.log('All resources fetched!');

                var sortedPicturesData = picturesData;

                if (picturesCount > 0 && picturesData.length > 0) {
                    // console.log('Reorder pictures array...');

                    sortedPicturesData.sort(function(a, b) {
                        return data.bilder.indexOf(a._id) - data.bilder.indexOf(b._id);
                    });

                    // console.log('Done!');

                }

                res.render('route', {
                    pageTitle: data.navn,
                    routeApiUri: options.routeApiUri,
                    routeName: routeData.navn,
                    routeData: JSON.stringify(routeData),
                    picturesData: JSON.stringify(sortedPicturesData),
                    poisData: JSON.stringify(poisData),
                    userData: JSON.stringify(req.session.user),
                    authType: req.session.authType,
                    userGroups: JSON.stringify(userGroups)
                });

            });

            allResourcesLoaded();

        };

        restProxy.makeApiRequest('/turer/' + turId, req, undefined, onCompleteTurRequest);

    };

    app.get('/tur', userGroupsFetcher);
    app.get('/tur', route);

    app.get('/tur/:id', userGroupsFetcher);
    app.get('/tur/:id', routeEdit);

};
