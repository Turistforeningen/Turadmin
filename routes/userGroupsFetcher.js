/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, express, options) {
    "use strict";

    var api = options.api;

    return function (req, res, next) {

        var userGroups = [];

        if (req.session && req.session.user && (!!req.session.user.sherpa_id)) {

            api.getAssociationsFor({bruker_sherpa_id: req.session.user.sherpa_id}, function(err, statusCode, associations) {
                if (err) { throw err; }
                if (statusCode === 200) {

                    for (var i = 0; i < associations.length; i++) {
                        userGroups.push(associations[i]);
                    }

                    req.userGroups = userGroups;
                    next();

                } else {

                    console.error('Request failed! HTTP status code returned is ' + statusCode);
                    console.error(associations.errors);
                    next();
                }
            });

        } else {

            console.log('Not implemented.');
            next();
            // User is authenticated by other method than DNT Connect
            // render(renderenderOptions);
        }

    };

};
