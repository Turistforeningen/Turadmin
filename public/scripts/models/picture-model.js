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

        popoverTemplateId: "#picturePopupTemplate",

        defaults: {
            markerIcon: 'map-icon-picture'
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
            'privat',
            'status',
            'tags',
            'thumbnailUrl',
            'tilbyder',
            'url'
        ],

        validation: {
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            }
        },

        initialize: function (options) {

            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.on('change', function () {
                this.changed = true;
            });

            var fotograf = this.get('fotograf') || {};
            this.set('fotografNavn', fotograf.navn);
            this.set('fotografEpost', fotograf.epost);

            this.on("change:fotografNavn", this.onFotografNavnChange, this);
            this.on("change:fotografEpost", this.onFotografEpostChange, this);

            this.updateIsPositioned();
            this.on("change:geojson", this.updateIsPositioned, this);

            var urls = this.getUrls();
            this.set("thumbnailUrl", urls.thumbnail);
            this.set("url", urls.url);
        },

        onFotografNavnChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.navn = this.get('fotografNavn');
            this.set('fotograf', fotograf);
        },

        onFotografEpostChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.epost = this.get('fotografEpost');
            this.set('fotograf', fotograf);
        },

        hasChanged: function () {
            return !!this.changed;
        },

        resetHasChanged: function () {
            this.changed = false;
        },

        isDeleted: function () {
            return !!this.get('deleted') && this.get('deleted');
        },

        getGeoJson: function () {
            return _.clone(this.get('geojson'));
        },

        getMarker: function () {
            return this.marker;
        },

        hasMarker: function () {
            return !!this.getMarker();
        },

        hasPosition: function () {
            var geojson = this.get('geojson');
            return !!geojson && !!geojson.coordinates;
        },

        setPublished: function () {
            this.set('status', 'Offentlig');
        },

        setUnpublished: function () {
            this.set('status', 'Kladd');
        },

        deletePicture: function () {
            this.set('deleted', true);
            this.trigger('deletePicture');
        },

        updateIsPositioned: function () {
            var geojson = this.get('geojson');
            var isPositioned = (!!geojson && !!geojson.coordinates);
            this.set('isPositioned', isPositioned);
        },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set("geojson", geoJson);
        },

        getUrls: function () {
            var urls = {thumbnail: "", url: ""};
            var imageArray = this.get("img");
            if (!!imageArray && imageArray.length) {
                urls.thumbnail = imageArray[imageArray.length-1]['url'];
                urls.url = imageArray[0]['url'];
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
