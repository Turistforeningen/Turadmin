
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
    var route = function (req, res) {
        res.render('route', { title: 'Opprett ny tur', routeApiUri: options.routeApiUri });
    };

    app.get('/tur', route);
};
