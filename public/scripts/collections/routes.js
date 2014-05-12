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

        model: ns.Route,

        // Order routes by date changed, descending
        comparator: function(model) {
            var date = new Date(model.get('endret'));
            return -date;
        },

        url: function () {
            return apiUri();
        },

        parse: function (response) {
            return response.documents || [];
        }
    });

}(DNT));
