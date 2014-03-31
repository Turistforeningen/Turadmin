/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.User = Backbone.Model.extend({

        idAttribute: "_id",

        type: "user",

        defaults : {
            _id: 'someId',
            navn: 'Ola Nordmann',
            epost: 'ola@nordmann.no'
        },

        initialize: function () {
        }

    });

}(DNT));
