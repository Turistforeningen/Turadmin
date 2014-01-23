/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/apiProxy/bilder";
    };

    ns.Picture = Backbone.Model.extend({
        idAttribute: "_id",

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            geojson: null,
            lisens: "CC BY-NC 3.0 NO",
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

    ns.PictureList = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },
        model: ns.Picture
    });
}(DNT));

