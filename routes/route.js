
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, restProxy, options) {
    "use strict";

    /*
     * GET add new route page.
     */
    var route = function (req, res) {
        req.session.userId = "testUserId";
        res.render('route', { title: 'Opprett ny tur', routeApiUri: options.routeApiUri });
    };

    var routeEdit = function (req, res) {

        var turId = req.params.id;

        // TODO: Fix dynamic URL
        var url = 'http://localhost:3000/restProxy/turer/' + turId;

        var onCompleteTurRequest = function (data) {
            req.session.userId = "testUserId";

            res.render('route', {
                pageTitle: 'Endre tur',
                routeApiUri: options.routeApiUri,
                turData: data
            });
        };

        restProxy.makeApiRequest("/turer/" + turId, 'GET', undefined, onCompleteTurRequest);

    };

    app.get('/tur', route);
    app.get('/tur/:id', routeEdit);

};
