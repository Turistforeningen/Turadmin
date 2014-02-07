/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.SearchFieldView = Backbone.View.extend({


        el: "#placeSearchInput",

        events: {
            "keyup": "search"
        },

        initialize: function () {
            _.bindAll(this, "search");
        },

        search: function () {
            var place = this.$.val();
            console.log("place: ", place);
        },

        render: function () {
            return this;
        }
    });
}(DNT));
