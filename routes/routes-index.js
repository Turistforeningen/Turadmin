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

        var onCompleteOmraderRequest = function (data) {
            var areas = data.documents;
            var renderOptions = {
                title: 'Mine turer',
                areas: JSON.stringify(areas),
                userData: JSON.stringify(req.session.user),
                userGroups: JSON.stringify(userGroups),
                userDefaultRouteFetchQuery: JSON.stringify(userDefaultRouteFetchQuery),
                authType: req.session.authType,
                itemType: 'tur'
            };

            res.render('routes/index', renderOptions);
        };

        restProxy.makeApiRequest('/områder/?limit=100&fields=navn,_id&sort=navn&tilbyder=DNT&status=Offentlig', req, undefined, onCompleteOmraderRequest);
    };

    app.get('/turer', userGroupsFetcher);
    app.get('/turer', getRoutesIndex);

};
