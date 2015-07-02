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
        moment = require('moment');

    return Backbone.Model.extend({

        el: '[data-view="route-marking"]',
        type: 'marking',

        validation: {
            kode: {
                required: true,
                msg: 'Ruten må ha en rutekode.'
            },
            beskrivelse: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            kvistingPeriode: function (val) {
                var diff = moment(this.get('kvistingFra'), 'DD.MM.YYYY').diff(moment(this.get('kvistingTil'), 'DD.MM.YYYY'));
                if (diff >= 0) {
                    return 'Fra dato må være tidligere enn til dato';
                }
            }
        },

        defaults: {
            merkinger: []
        },

        serverAttrs: [
            'kode',
            'type',
            'merkinger',
            'kilde',
            'merknader',
            'kvisting'
        ],

        initialize: function (options) {

            options = options || {};

            if (typeof options.kvisting === 'object') {
                if (options.merkinger.indexOf('Kvisting') === -1) {
                    this.get('merkinger').push('Kvisting');
                }
                if (typeof options.kvisting.fra === 'string') {
                    this.set('kvistingFra', moment(options.kvisting.fra).format('DD.MM.YYYY'));
                }
                if (typeof options.kvisting.til === 'string') {
                    this.set('kvistingTil', moment(options.kvisting.til).format('DD.MM.YYYY'));
                }
                this.set('kvistingHelars', options.kvisting.helårs);
                this.set('kvistingKommentar', options.kvisting.kommentar);
            }

            this.on('change:kvistingFra', function (e) {
                var isValid = this.isValid(true);
                var kvisting = this.get('kvisting') || {};
                if (typeof e.changed.kvistingFra === 'string') {
                    kvisting.fra = moment(e.changed.kvistingFra, 'DD.MM.YYYY').format();
                } else {
                    delete kvisting.fra;
                }
                this.set('kvisting', kvisting);
            });

            this.on('change:kvistingTil', function (e) {
                var isValid = this.isValid(true);
                var kvisting = this.get('kvisting') || {};
                if (typeof e.changed.kvistingTil === 'string') {
                    kvisting.til = moment(e.changed.kvistingTil, 'DD.MM.YYYY').format();
                } else {
                    delete kvisting.til;
                }
                this.set('kvisting', kvisting);
            });

            this.on('change:kvistingHelars', function (e) {
                var kvisting = this.get('kvisting') || {};
                kvisting.helårs = e.changed.kvistingHelars;
                if (e.changed.kvistingHelars) {
                    this.unset('kvistingFra');
                    this.unset('kvistingTil');
                }
                this.set('kvisting', kvisting);
            });

            this.on('change:kvistingKommentar', function (e) {
                var kvisting = this.get('kvisting') || {};
                kvisting.kommentar = e.changed.kvistingKommentar;
                this.set('kvisting', kvisting);
            });

            this.on('change:merkinger', function (e) {
                if (e.changed.merkinger.indexOf('Kvisting') === -1) {
                    this.unset('kvisting');
                    this.unset('kvistingFra');
                    this.unset('kvistingTil');
                    this.unset('kvistingHelars');
                    this.unset('kvistingKommentar');
                }
            });
        },

        toServerJSON: function () {
            return _.pick(this.attributes, this.serverAttrs);
        }

    });

});
