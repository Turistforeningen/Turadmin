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

        changed: false,

        deleted: false,

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            navn: "",
            geojson: undefined,
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },

        initialize: function () {
            this.on("change", function () {
                this.changed = true;
            });
        },

        hasChanged: function () {
            return this.changed;
        },

        resetHasChanged: function () {
            this.changed = false;
        },

        isDeleted: function () {
            return this.deleted;
        },

        getGeoJson: function () {
            return _.clone(this.get("geojson"));
        },

        getMarker: function () {
            if (this.marker() === undefined && this.hasPosition()) {
                this.createMarker();
            }
            return this.marker;
        },

        hasPosition: function () {
            return this.get("geojson") !== undefined;
        },

        deletePicture: function () {
            this.deleted = true;
            this.trigger("deletePicture");
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
            this.marker = marker;
            marker.setIcon(icon);
            this.trigger('registerPopup', this);
            marker.on("dragend", function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                this.updateGeojson(lat, lng);
            }, this);
        },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set("geojson", geoJson);
        }
    });
}(DNT));

