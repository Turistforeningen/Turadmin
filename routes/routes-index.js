/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var restProxy = options.restProxy;

    /**
     * GET list of routes (index page)
     */
    var getRoutesIndex = function (req, res) {

        var userGroups = req.userGroups || [];
        var userDefaultRouteFetchQuery = (!!req.signedCookies) ? req.signedCookies['userDefaultRouteFetchQuery_' + req.session.userId] : undefined;

        var areas;
        var groups;

        var onCompleteOmraderRequest = function (data) {
            areas = data.documents;
            onCompleteNtbRequest();
        };

        var onCompleteGrupperRequest = function (data) {
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

        restProxy.makeApiRequest('/områder/?limit=100&fields=navn,_id&sort=navn&tilbyder=DNT&status=Offentlig', req, undefined, onCompleteOmraderRequest);

        restProxy.makeApiRequest('/grupper/?tags=!&limit=400&fields=navn&sort=navn', req, undefined, onCompleteGrupperRequest);
    };

    app.get('/turer', userGroupsFetcher);
    app.get('/turer', getRoutesIndex);

};
