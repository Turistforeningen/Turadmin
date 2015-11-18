module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var restProxy = options.restProxy;
    var TurbasenAuth = require('turbasen-auth');

    var turbasenAuthClient = new TurbasenAuth('Turadmin', process.env.NTB_API_KEY, {env: process.env.NTB_API_ENV || 'dev'});


    /*
     * All GET requests to /grupper
     */
    var getChown = function (req, res, next) {

        if (req.session.user.er_admin) {
            req.renderOptions = req.renderOptions || {};
            req.renderOptions.isAdmin = req.session.user.er_admin;
            next();

        } else {
            res.redirect(401, '/turer');
        }

    };

    /**
     * GET list of groups (index page)
     */
    var getChownIndex = function (req, res, next) {
        var renderOptions = {
            title: 'Endre eier',
            isAdmin: req.session.user.er_admin
        };

        res.render('chown/index', renderOptions);
    };

    app.get('/eierskifte', getChownIndex);
};
