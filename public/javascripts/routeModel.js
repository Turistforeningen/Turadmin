/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/apiProxy/turer";
    };

    ns.Route = Backbone.Model.extend({
        idAttribute: "_id",

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            geojson: null,
            retning: "AB",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },
        initialize: function () {
        }
    });

    ns.RouteCollection = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },
        model: ns.Route
    });
}(DNT));

