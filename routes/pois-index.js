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
    var getPoisIndex = function (req, res) {

        var userGroups = req.userGroups || [];
        var userDefaultRouteFetchQuery = (!!req.signedCookies) ? req.signedCookies['userDefaultRouteFetchQuery_' + req.session.userId] : undefined;

        var renderOptions = {
            title: 'Mine steder',
            userData: JSON.stringify(req.session.user),
            userGroups: JSON.stringify(userGroups),
            userDefaultRouteFetchQuery: JSON.stringify(userDefaultRouteFetchQuery),
            authType: req.session.authType,
            isAdmin: req.session.user.er_admin,
            itemType: 'sted',
        };

        res.render('pois/index', renderOptions);

    };

    app.get('/steder', userGroupsFetcher);
    app.get('/steder', getPoisIndex);

};
