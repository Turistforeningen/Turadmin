/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/bilder";
    };

    ns.Picture = Backbone.Model.extend({

        idAttribute: "_id",

        type: "picture",

        changed: false,

        deleted: false,

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            },
            fotograf: {
                navn: ""
            }
        },

        initialize: function () {
            this.on("change", function () {
                this.changed = true;
            });

            this.positionChanged();
            this.on("change:geojson", this.positionChanged);

            var urls = this.getUrls();
            this.set("thumbnailUrl", urls.thumbnail);
            this.set("url", urls.url);
        },

        hasChanged: function () {
            return !!this.changed;
        },

        resetHasChanged: function () {
            this.changed = false;
        },

        isDeleted: function () {
            return !!this.get("deleted") && this.get("deleted");
        },

        getGeoJson: function () {
            return _.clone(this.get("geojson"));
        },

        getMarker: function () {
            return this.marker;
        },

        hasMarker: function () {
            return !!this.getMarker();
        },

        hasPosition: function () {
            var geojson = this.get("geojson");
            return !!geojson && !!geojson.coordinates;
        },

        setPublished: function() {
            this.set('status', 'Offentlig');
        },

        setUnpublished: function() {
            this.set('status', 'Kladd');
        },

        deletePicture: function () {
            this.set("deleted", true);
            this.trigger("deletePicture");
        },

        positionChanged: function () {
            if (this.hasPosition() && this.getMarker() === undefined) {
                this.createMarker(this.get("geojson"));
            }
        },

        createMarker: function (geojson) {
            var icon = new L.icon({
                iconUrl: '/images/poi/21.png',
                iconRetinaUrl: '/images/poi/21@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });
            var marker = new L.Marker([this.getGeoJson().coordinates[1], this.getGeoJson().coordinates[0]], {draggable: true});
            this.marker = marker;
            marker.setIcon(icon);
            this.trigger('registerPopup', {model: this, templateId: "#picturePopupTemplate"});
            marker.on("dragend", function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                this.updateGeojson(lat, lng);
            }, this);
            this.trigger("picture:markerCreated", this);
        },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set("geojson", geoJson);
        },

        getUrls: function () {
            var urls = {thumbnail: "", url: ""};
            var imageArray = this.get("img");
            if (!!imageArray) {
                _.each(imageArray, function (image) {
                    if (!!image.width && !!image.height) {
                        urls.thumbnail = image.url;
                    } else {
                        urls.url = image.url;
                    }
                });
            }
            return urls;
        }
    });

}(DNT));

