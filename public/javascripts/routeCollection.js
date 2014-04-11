/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/turer";
    };

    ns.RouteCollection = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },

        model: ns.Route,

        parse: function (response) {
            return response.documents || [];
        }
    });

}(DNT));
