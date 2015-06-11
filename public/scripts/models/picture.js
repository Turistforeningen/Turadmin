/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        NtbModel = require('models/ntb'),
        PopoverTemplate = require('text!templates/pictures/popover.html');

    var apiUri = function () {
        return '/restProxy/bilder';
    };

    return NtbModel.extend({

        idAttribute: '_id',
        type: 'picture',
        changed: false,
        deleted: false,
        popoverTemplate: PopoverTemplate,

        urlRoot: function () {
            return apiUri();
        },

        defaults: {
            markerIcon: 'map-icon-picture',
            lisens: 'CC BY-SA 4.0'
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
            'navngiving',
            'privat',
            'status',
            'tags',
            'tilbyder'
        ],

        validation: {
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            fotografEpost: {
                pattern: 'email',
                msg: 'Må være en gyldig epostadresse.'
            },

        },

        initialize: function (options) {

            NtbModel.prototype.initialize.call(this, options);

            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.on('change', function () {
                this.changed = true;
            });

            var fotograf = this.get('fotograf') || {};
            this.set('fotografNavn', fotograf.navn);
            this.set('fotografEpost', fotograf.epost);

            this.on('change:fotografNavn', this.onFotografNavnChange, this);
            this.on('change:fotografEpost', this.onFotografEpostChange, this);

            this.updateIsPositioned();
            this.on('change:geojson', this.updateIsPositioned, this);

            var urls = this.getUrls();
            this.set('thumbnailUrl', urls.thumbnail);
            this.set('url', urls.url);

            if (!this.get('_id')) {
                this.save();
            }
        },

        onFotografNavnChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.navn = this.get('fotografNavn');
            this.set('fotograf', fotograf);
        },

        onFotografEpostChange: function () {
            var fotograf = this.get('fotograf');
            fotograf.epost = (this.isValid('fotografEpost')) ? this.get('fotografEpost') : '';
            this.set('fotograf', fotograf);
        },

        setCommercialLicense: function (hasCommercialLicense) {
            if (hasCommercialLicense) {
                this.set('lisens', 'CC BY-SA 4.0');

            } else {
                this.set('lisens', 'CC BY-NC-SA 4.0');
            }
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
                urls.thumbnail = imageArray[imageArray.length-1].url;
                urls.url = imageArray[0].url;
            }

            return urls;
        },

        getNamingBy: function () {
            var photographer = this.get('fotograf');
            var photographerName = (!!photographer && !!photographer.navn) ? photographer.navn : undefined;
            return photographerName;
        }

    });

});
