
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

        console.log('GET index');

        var userGroups = req.userGroups || [];

        var renderOptions = {
            title: 'Mine turer',
            userData: JSON.stringify(req.session.user),
            userGroups: JSON.stringify(userGroups),
            authType: req.session.authType
        };

        res.render('index', renderOptions);

    };

    app.get('/', userGroupsFetcher);
    app.get('/', getIndex);
    app.get('/index', userGroupsFetcher);
    app.get('/index', getIndex);

};
