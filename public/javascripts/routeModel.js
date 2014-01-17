/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.Route = Backbone.Model.extend({
        defaults : {
            geojson: null,
            retning: "AB",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        }
    });

    ns.RouteList = Backbone.Collection.extend({
        url: "apiUrl",
        model: ns.Route
    });
}(DNT));

