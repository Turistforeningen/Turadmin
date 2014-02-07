/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.SearchCollection = Backbone.Collection.extend({
        url: "/ssrProxy/",

        model: ns.SearchResult,

        search: function (searchText) {
            this.fetch({
                data: {
                    search: searchText
                },
                dataType: "json",
                reset: true
            });
        }
    });
}(DNT));

