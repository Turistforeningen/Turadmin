
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, restProxy, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var NodeCache = require('node-cache');
    var cache = new NodeCache();

    /*
     * GET route. before routeNew and routeEdit
     */
    var route = function (req, res, next) {

        var userGroups = req.userGroups || [];
        var externalGroups = req.userGroups || [];

        req.renderOptions = req.renderOptions || {};
        req.renderOptions.userData = JSON.stringify(req.session.user);
        req.renderOptions.userGroups = JSON.stringify(userGroups);
        req.renderOptions.routeApiUri = options.routeApiUri;
        req.renderOptions.authType = req.session.authType;
        req.renderOptions.isAdmin = req.session.user.er_admin;

        var onCompleteExternalGroupsRequest = function (data) {
            req.renderOptions.externalGroups = JSON.stringify(data.documents);
            next();
        };

        var cachedGrupper = cache.get('/grupper/?tags=!DNT&limit=1000&fields=navn&sort=navn');
        if (cachedGrupper) {
            onCompleteExternalGroupsRequest(cachedGrupper);

        } else {
            restProxy.makeApiRequest('/grupper/?tags=!DNT&limit=1000&fields=navn&sort=navn', req, undefined, onCompleteExternalGroupsRequest);
        }

    };


    /*
     * GET add new route page.
     */
    var routeNew = function (req, res, next) {

        req.renderOptions = req.renderOptions || {};
        req.renderOptions.title = 'Opprett ny tur';
        res.render('routes/editor', req.renderOptions);
    };

    var routeEdit = function (req, res, next) {

        var turId = req.params.id;

        var onCompleteTurRequest = function (data) {

            var routeData = data;

            var picturesCount = (!!data.bilder) ? data.bilder.length : 0;
            var picturesData = [];

            // console.log('Route has', picturesCount, 'pictures.');
            var poisCount = (!!data.steder) ? data.steder.length : 0;
            var poisData = [];

            var groupsCount = (!!data.grupper) ? data.grupper.length : 0;
            var groupsData = [];

            // console.log('Route has', poisCount, 'pois.');
            var totalResourcesCount = picturesCount + poisCount + groupsCount + 1; // +1 is the route request

            // console.log('Route has', totalResourcesCount, 'total resources including route.');
            var onCompletePictureRequest = function (data) {
                picturesData.push(data);
                allResourcesLoaded();
            };

            var onCompletePoiRequest = function (data) {
                poisData.push(data);
                allResourcesLoaded();
            };

            var onCompleteGroupRequest = function (data) {
                groupsData.push(data);
                allResourcesLoaded();
            };

            // console.log('Fetching', picturesCount, 'pictures...');
            for (var i = 0; i < picturesCount; i++) {
                var pictureId = data.bilder[i];
                // TODO: If request returns 404, remove picture from route pictures array
                restProxy.makeApiRequest('/bilder/' + pictureId, req, undefined, onCompletePictureRequest);
            }
            // console.log('Done!');

            // console.log('Fetching', poisCount, 'pois...');
            for (var j = 0; j < poisCount; j++) {
                var poiId = data.steder[j];
                restProxy.makeApiRequest('/steder/' + poiId, req, undefined, onCompletePoiRequest);
            }
            // console.log('Done!');

            for (var k = 0; k < groupsCount; k++) {
                var groupId = data.grupper[k];
                restProxy.makeApiRequest('/grupper/' + groupId, req, undefined, onCompleteGroupRequest);
            }

            var allResourcesLoaded = underscore.after(totalResourcesCount, function () {

                var sortedPicturesData = picturesData;

                if (picturesCount > 0 && picturesData.length > 0) {
                    // console.log('Reorder pictures array...');
                    sortedPicturesData.sort(function(a, b) {
                        return data.bilder.indexOf(a._id) - data.bilder.indexOf(b._id);
                    });
                }


                var sortedPoisData = poisData;

                if (poisCount > 0 && poisData.length > 0) {
                    // console.log('Reorder pois array...');
                    sortedPoisData.sort(function(a, b) {
                        return data.steder.indexOf(a._id) - data.steder.indexOf(b._id);
                    });
                }

                req.renderOptions = req.renderOptions || {};
                req.renderOptions.title = data.navn;
                req.renderOptions.routeName = routeData.navn;
                req.renderOptions.routeData = JSON.stringify(routeData);
                req.renderOptions.picturesData = JSON.stringify(sortedPicturesData);
                req.renderOptions.poisData = JSON.stringify(sortedPoisData);
                req.renderOptions.groupsData = JSON.stringify(groupsData);

                res.render('routes/editor', req.renderOptions);
            });

            allResourcesLoaded();

        };

        restProxy.makeApiRequest('/turer/' + turId, req, undefined, onCompleteTurRequest);

    };

    var redirect = function (req, res, next) {
        var id = req.params.id;
        if (id) {
            res.redirect(301, '/turer/' + id);

        } else {
            res.redirect(301, '/turer/ny');
        }
    };

    app.get('/tur', redirect);
    app.get('/tur/:id', redirect);

    app.get('/turer*', userGroupsFetcher);
    app.get('/turer*', route);

    app.get('/turer/ny', routeNew);
    app.get('/turer/:id', routeEdit);

};
