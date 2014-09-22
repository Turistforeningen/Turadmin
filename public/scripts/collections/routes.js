/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return '/restProxy/turer';
    };

    ns.RouteCollection = ns.NtbCollection.extend({

        model: ns.Route,

        url: function () {
            return apiUri();
        }
    });

}(DNT));
