/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var restProxy = options.restProxy;
    var NodeCache = require('node-cache');
    var cache = new NodeCache();

    /**
     * GET list of routes (index page)
     */
    var getRoutesIndex = function (req, res) {

        var userGroups = req.userGroups || [];
        var userDefaultRouteFetchQuery = (!!req.signedCookies) ? req.signedCookies['userDefaultRouteFetchQuery_' + req.session.userId] : undefined;

        var areas;
        var groups;

        var onCompleteOmraderRequest = function (data) {
            cache.set('alle_omrader_response', data, 86400);
            areas = data.documents;
            onCompleteNtbRequest();
        };

        var onCompleteGrupperRequest = function (data) {
            cache.set('alle_eksterne_grupper_response', data, 86400);
            groups = data.documents;
            onCompleteNtbRequest();
        };

        var onCompleteNtbRequest = underscore.after(2, function () {
            var renderOptions = {
                title: 'Mine turer',
                areas: JSON.stringify(areas),
                userData: JSON.stringify(req.session.user),
                userGroups: JSON.stringify(userGroups),
                externalGroups: JSON.stringify(groups),
                userDefaultRouteFetchQuery: JSON.stringify(userDefaultRouteFetchQuery),
                authType: req.session.authType,
                itemType: 'tur'
            };

            res.render('routes/index', renderOptions);
        });

        var cachedOmrader = cache.get('alle_omrader_response');
        if (cachedOmrader) {
            areas = cachedOmrader.documents;
            onCompleteNtbRequest();
        } else {
            restProxy.makeApiRequest('/områder/?limit=100&fields=navn,_id&sort=navn&tilbyder=DNT&status=Offentlig', req, undefined, onCompleteOmraderRequest);
        }

        var cachedGrupper = cache.get('alle_eksterne_grupper_response');
        if (cachedGrupper) {
            groups = cachedGrupper.documents;
            onCompleteNtbRequest();

        } else {
            restProxy.makeApiRequest('/grupper/?tags=!&limit=200&fields=navn&sort=navn', req, undefined, onCompleteGrupperRequest);
        }

    };

    app.get('/turer', userGroupsFetcher);
    app.get('/turer', getRoutesIndex);

};
