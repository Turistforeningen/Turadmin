
/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    // var underscore = require('underscore');
    // var userGroupsFetcher = options.userGroupsFetcher;

    /**
     * GET list of routes (index page)
     */
    var getTermsAndConditions = function (req, res) {

        var renderOptions = {
            title: 'Godkjenn villkår',
            // userData: JSON.stringify(req.session.user),
            // userGroups: JSON.stringify(userGroups),
            // authType: req.session.authType
        };

        res.render('termsAndConditions', renderOptions);

    };

    app.get('/brukervillkar', getTermsAndConditions);

};
