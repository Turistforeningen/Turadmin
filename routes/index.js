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
    var getIndex = function (req, res) {

        var userGroups = req.userGroups || [];
        var userDefaultGroup = (!!req.signedCookies && !!req.signedCookies.userLastUsedGroup) ? req.signedCookies.userLastUsedGroup : undefined;

        var renderOptions = {
            title: 'Mine turer',
            userData: JSON.stringify(req.session.user),
            userGroups: JSON.stringify(userGroups),
            userDefaultGroup: userDefaultGroup,
            authType: req.session.authType,
        };

        res.render('index', renderOptions);

    };

    app.get('/', userGroupsFetcher);
    app.get('/', getIndex);
    app.get('/index', userGroupsFetcher);
    app.get('/index', getIndex);

};
