
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
     * GET poi. before poiNew and poiEdit
     */
    var poi = function (req, res, next) {

        var userGroups = req.userGroups || [];

        req.renderOptions = req.renderOptions || {};
        req.renderOptions.userData = JSON.stringify(req.session.user);
        req.renderOptions.userGroups = JSON.stringify(userGroups);
        req.renderOptions.routeApiUri = options.routeApiUri;
        req.renderOptions.authType = req.session.authType;

        next();
    };


    /*
     * GET add new poi page.
     */
    var poiNew = function (req, res, next) {
        req.renderOptions = req.renderOptions || {};
        req.renderOptions.title = 'Opprett nytt sted';
        res.render('poi', req.renderOptions);
    };

    var poiEdit = function (req, res, next) {
        var poiId = req.params.id;

        var onCompletePoiRequest = function (data) {

            var poiData = data;

            var picturesCount = (!!data.bilder) ? data.bilder.length : 0;
            var picturesData = [];

            var totalResourcesCount = picturesCount + 1; // +1 is the poi

            var onCompletePictureRequest = function (data) {
                picturesData.push(data);
                allResourcesLoaded();
            };

            for (var i = 0; i < picturesCount; i++) {
                var pictureId = data.bilder[i];
                // TODO: If request returns 404, remove picture from poi pictures array
                restProxy.makeApiRequest('/bilder/' + pictureId, req, undefined, onCompletePictureRequest);
            }



            var allResourcesLoaded = underscore.after(totalResourcesCount, function () {

                var sortedPicturesData = picturesData;

                if (picturesCount > 0 && picturesData.length > 0) {
                    sortedPicturesData.sort(function(a, b) {
                        return data.bilder.indexOf(a._id) - data.bilder.indexOf(b._id);
                    });
                }

                req.renderOptions = req.renderOptions || {};
                req.renderOptions.title = data.navn;
                req.renderOptions.poiName = poiData.navn;
                req.renderOptions.poiData = JSON.stringify(poiData);
                req.renderOptions.picturesData = JSON.stringify(sortedPicturesData);

                res.render('poi', req.renderOptions);
            });

            allResourcesLoaded();

        };

        restProxy.makeApiRequest('/steder/' + poiId, req, undefined, onCompletePoiRequest);

    };

    app.get('/sted*', userGroupsFetcher);
    app.get('/sted*', poi);

    app.get('/sted', poiNew);
    app.get('/sted/:id', poiEdit);

};
