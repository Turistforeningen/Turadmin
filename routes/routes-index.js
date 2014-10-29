/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;

    /**
     * GET list of routes (index page)
     */
    var getRoutesIndex = function (req, res) {

        var userGroups = req.userGroups || [];
        var userDefaultRouteFetchQuery = (!!req.signedCookies) ? req.signedCookies.userDefaultRouteFetchQuery : undefined;

        var renderOptions = {
            title: 'Mine turer',
            userData: JSON.stringify(req.session.user),
            userGroups: JSON.stringify(userGroups),
            userDefaultRouteFetchQuery: JSON.stringify(userDefaultRouteFetchQuery),
            authType: req.session.authType,
            itemType: 'tur'
        };

        res.render('routes/index', renderOptions);

    };

    app.get('/turer', userGroupsFetcher);
    app.get('/turer', getRoutesIndex);

};
