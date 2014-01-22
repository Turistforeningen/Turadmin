/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/apiProxy/steder";
    };

    ns.Poi = Backbone.Model.extend({
        idAttribute: "_id",

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            geojson: null,
            lisens: "CC BY 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },
        initialize: function (attributes, options) {
        },

        getGeoJson: function () {
            return this.get("geojson");
        },

        getMarker: function () {
            if (!this.hasMarker()) {
                this.createMarker();
            }
            return this.marker;
        },

        hasMarker: function () {
            return !!this.marker;
        },

        createMarker: function () {
            var icon = new L.icon({
                iconUrl: 'images/poi/21.png',
                iconRetinaUrl: 'images/poi/21@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });
            var marker = new L.Marker([this.getGeoJson().coordinates[1], this.getGeoJson().coordinates[0]], {draggable: true});
            marker.setIcon(icon);
            var that = this;
            this.marker = marker;
            this.trigger('showPopup', this);
        }
    });

}(DNT));
