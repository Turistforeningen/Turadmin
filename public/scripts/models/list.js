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
        PoiCollection = require('collections/pois'),
        PictureCollection = require('collections/pictures'),
        NtbModel = require('models/ntb');

    // Module
    return NtbModel.extend({

        type: 'list',
        idAttribute: '_id',
        forcedLicense: 'CC BY-SA 4.0',

        urlRoot: '/ntb-api/lister',

        defaults: {
            // navn: '', // Not set as default, because of validation
            // beskrivelse: '', // Not set as default, because of validation
            lenker: [],
            lisens: 'CC BY-SA 4.0',
            status: 'Offentlig',
            tags: [],
            privat: {}
        },

        forced: {
            status: 'Offentlig'
        },

        serverAttrs: [
            // '_id', 'tilbyder', 'endret', 'checksum' // Legges automatisk inn av Nasjonal Turbase
            'lisens',
            'navngiving',
            'status',
            'navn',
            'beskrivelse',
            'lenker',
            'tags',
            'privat',
            'grupper',
            'geojson',
            'start',
            'stopp',
            'bilder',
            'steder',
            'url'
        ],

        validation: {
            navn: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            }
        },

        initialize: function (options) {
            options = options || {};

            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.bilder = new PictureCollection(options.bilder);
            this.steder = new PoiCollection(options.steder);

            NtbModel.prototype.initialize.call(this, options);
        },

        save: function (attrs, options) {

            attrs = attrs || this.toJSON();
            attrs.steder = this.steder.pluck('id');
            attrs.bilder = this.bilder.pluck('id');
            options.attrs = attrs;

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        }

    });

});
