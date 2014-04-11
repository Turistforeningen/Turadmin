
/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');

    var client = options.dntConnect;
    var api = options.dntApi;

    /**
     * GET list of routes (index page)
     */
    var getIndex = function (req, res) {

        console.log('GET index');

        var userGroups = [];

        var renderOptions = {
            title: 'Mine turer',
            userData: JSON.stringify(req.session.user),
            userGroups: null,
            authType: req.session.authType
        };

        var render = function (options) {
            res.render('index', options);
        };

        if (req.session.user && (!!req.session.user.sherpa_id)) {

            api.getAssociationsFor({bruker_sherpa_id: req.session.user.sherpa_id}, function(err, statusCode, associations) {
                if (err) { throw err; }
                if (statusCode === 200) {

                    for (var i = 0; i < associations.length; i++) {
                        userGroups.push(associations[i]);
                    }

                    renderOptions.userGroups = JSON.stringify(userGroups);

                    render(renderOptions);

                } else {
                    console.error('Request failed! HTTP status code returned is ' + statusCode);
                    console.error(associations.errors);
                }
            });

        } else {
            console.log('Not implemented.');
            // User is authenticated by other method than DNT Connect
            // render(renderenderOptions);
        }


    };

    app.get('/', getIndex);
    app.get('/index', getIndex);

};

