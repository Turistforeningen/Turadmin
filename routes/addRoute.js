
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    /*
     * GET add new route page.
     */
    var addRoute = function (req, res) {
        res.render('addRoute', { title: 'Opprett ny tur', routeApiUri: options.routeApiUri });
    };

    app.get('/addRoute', addRoute);
};


