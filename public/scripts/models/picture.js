/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return '/restProxy/bilder';
    };

    ns.Picture = Backbone.Model.extend({

        idAttribute: '_id',
        type: 'picture',
        changed: false,
        deleted: false,

        urlRoot: function () {
            return apiUri();
        },

        defaults: {
            lisens: 'CC BY-NC 3.0 NO',
            status: 'Kladd',
            privat: {
                opprettet_av: {
                    id: 'someId'
                }
            },
            fotograf: {
                navn: ''
            },
            tags: []
        },

        serverAttrs: [
            '_id',
            'beskrivelse',
            'checksum',
            'count',
            'endret',
            'fotograf',
            'geojson',
            'img',
            'lisens',
            'navn',
            'ordinal',
            'privat',
            'status',
            'tags',
            'thumbnailUrl',
            'tilbyder',
            'url'
        ],

        initialize: function () {
            this.on('change', function () {
                this.changed = true;
            });

            this.set('fotografNavn', this.get('fotograf').navn);
            this.set('fotografEpost', this.get('fotograf').epost);

            this.on("change:fotografNavn", this.onFotografNavnChange, this);
            this.on("change:fotografEpost", this.onFotografEpostChange, this);

            this.positionChanged();
            this.on("change:geojson", this.positionChanged);

            var urls = this.getUrls();
            this.set("thumbnailUrl", urls.thumbnail);
            this.set("url", urls.url);

        },

        onFotografNavnChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.navn = this.get('fotografNavn');
            this.set('fotograf', fotograf);
            // console.log('fotograf changed to', fotograf);
        },

        onFotografEpostChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.epost = this.get('fotografEpost');
            this.set('fotograf', fotograf);
            // console.log('fotograf changed to', fotograf);
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

        setPublished: function () {
            this.set('status', 'Offentlig');
        },

        setUnpublished: function () {
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
                iconUrl: '/images/poi/map-icon-image.png',
                iconRetinaUrl: '/images/poi/map-icon-image@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });
            var marker = new L.Marker([this.getGeoJson().coordinates[1], this.getGeoJson().coordinates[0]], { draggable: true });
            this.marker = marker;
            marker.setIcon(icon);
            this.trigger('registerPopover', {model: this, templateId: "#picturePopupTemplate"});
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
        },

        save: function (attrs, options) {

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = _.pick(attrs, this.serverAttrs);
            }

            // Move attrs to options
            options.attrs = attrs;

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);

        }

    });

}(DNT));
