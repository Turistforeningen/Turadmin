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
            this.on("add:geojson", function () {
                if (this.hasPosition() && this.getMarker() === undefined) {
                    this.createMarker(this.get("geojson"));
                }
            });
            this.set("url", this.getThumbnailImageUrl());
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
            return this.marker;
        },

        hasMarker: function () {
            return !!this.getMarker();
        },

        hasPosition: function () {
            var geojson = this.get("geojson");
            return !!geojson && !!geojson.coordinates;
        },

        deletePicture: function () {
            this.deleted = true;
            this.trigger("deletePicture");
        },

        createMarker: function (geojson) {
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
            this.trigger('registerPicturePopup', {model: this.createPicturePopupModel(), templateId: "#picturePopupTemplate"});
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

        createPicturePopupModel: function () {
            var json = {url: this.getThumbnailImageUrl(), navn: this.get("navn")};
            return new ns.PicturePopupModel(json, {marker: this.getMarker()});
        },

        getThumbnailImageUrl: function () {
            var url = "";
            var imageArray = this.get("img");
            if (!!imageArray) {
                _.each(imageArray, function (image) {
                    if (!!image.width && !!image.height) {
                        url = image.url;
                    }
                });
            }
            return url;
        }
    });

    /*
        Small model for picture popup - used to set url more accessible for popup
     */
    ns.PicturePopupModel = Backbone.Model.extend({

        defaults : {
            navn: ""
        },

        initialize : function (arg, opt) {
            this.marker = opt.marker;
        },

        getMarker: function () {
            return this.marker;
        }
    });

}(DNT));

