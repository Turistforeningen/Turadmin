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
        L = require('leaflet'),
        NtbModel = require('models/ntb');

    // Module
    return NtbModel.extend({

        idAttribute: '_id',

        defaults: {
            // navn: '', // Not set as default, because of validation
            // beskrivelse: '', // Not set as default, because of validation
            lenker: [],
            tidsbrukDager: '1',
            tidsbrukTimer: '0',
            tidsbrukMinutter: '0',
            tidsbruk: {normal: {}},
            retning: 'ABA',
            lisens: 'CC BY-NC 4.0',
            status: 'Kladd',
            tags: [],
            // gradering: '', // Not set as default, because of validation
            privat: {}
        },

        serverAttrs: [
            // '_id', 'tilbyder', 'endret', 'checksum' // Legges automatisk inn av Nasjonal Turbase
            'lisens',
            'navngiving',
            'status',
            'navn',
            'geojson',
            'distanse',
            'retning',
            'områder',
            'kommuner',
            'fylker',
            'beskrivelse',
            'adkomst',
            'kollektiv', // NOTE: Will this be a private field?
            'lenker',
            'gradering',
            'passer_for',
            'tilrettelagt_for',
            'sesong',
            'tidsbruk',
            'tags',
            'privat',
            'grupper',
            'bilder',
            'steder',
            'url'
        ],

        validation: {
            'geojson.coordinates': function (value) {
                if (!this.hasRoute()) {
                    return 'Turforslaget må inneholde en inntegning av turen.';
                }
            },
            navn: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            gradering: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            sesong: {
                // arrayMinLength: 1,
                required: true,
                msg: 'Velg minst én måned det normalt er mulig å gjennomføre turen.'
            },
            turtype: {
                required: true,
                msg: 'Minst én turtype må velges'
            }
        },

        initialize: function (options) {

            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.on('change:turtype', this.updateTurtypeInTags);
            this.on('change:flereTurtyper', this.updateFlereTurtyperInTags);

            var duration = this.get('tidsbruk');

            if (!!duration.normal) {
                this.set('tidsbrukDager', (!!duration.normal.dager) ? duration.normal.dager : 0);
                this.set('tidsbrukTimer', (!!duration.normal.timer) ? duration.normal.timer : 0);
                this.set('tidsbrukMinutter', (!!duration.normal.minutter) ? duration.normal.minutter : 0);
            }

            this.set('turtype', this.getRouteType());
            this.set('flereTurtyper', this.getAdditionalRouteTypes());

            NtbModel.prototype.initialize.call(this, options);

        },

        urlRoot: function () {
            return '/restProxy/turer';
        },

        setPoiIds: function (ids) {
            this.set('steder', ids);
        },

        setPictureIds: function (ids) {
            this.set('bilder', ids);
        },

        updateStartpunkt: function () {
            var geojson = this.get('geojson'),
                privat = this.get('privat') || {},
                startpunkt;

            if (geojson && geojson.coordinates && geojson.coordinates.length) {
                startpunkt = geojson.coordinates[0];
                privat.startpunkt = {type: 'Point', coordinates: startpunkt};
            } else {
                if (privat.startpunkt) {
                    delete privat.startpunkt;
                }
            }
        },

        updateTurtypeInTags: function () {
            var tags = this.get('tags');
            var turtype = this.get('turtype');
            tags[0] = turtype;
            this.set('tags', tags);
        },

        updateFlereTurtyperInTags: function () {
            var tags = this.get('tags');
            var turtype = tags[0];
            var flereTurtyper = this.get('flereTurtyper');
            tags = [turtype].concat(flereTurtyper);
            this.set('tags', tags);
        },

        getRouteType: function () {
            var tags = this.get('tags');
            return (tags.length) ? tags[0] : '';
        },

        getAdditionalRouteTypes: function () {
            var tags = this.get('tags');
            var additionalRouteTypes = _.rest(tags, 1);
            return additionalRouteTypes;
        },

        hasRoute: function () {
            var geojson = this.get('geojson');
            return (geojson && geojson.coordinates.length) ? true : false;
        },

        // Season months must be saved as integers
        updateSeason: function () {
            var season = this.get('sesong');
            if (!!season && season.length) {
                for (var i = 0; i < season.length; i++) {
                    season[i] = parseInt(season[i], 10);
                }
                this.set('sesong', season);
            }
        },

        save: function (attrs, options) {

            attrs = attrs || this.toJSON();
            options = options || {};

            // Remove geojson if empty
            if (!this.hasRoute()) {
                delete attrs.geojson;
            }

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        },

        updateTidsbruk: function () {
            var days = this.get('tidsbrukDager');
            var hours = this.get('tidsbrukTimer');
            var minutes = this.get('tidsbrukMinutter');

            var tidsbruk = {
                normal: {
                    timer: '0',
                    minutter: '0'
                }
            };
            tidsbruk.normal.dager = days;
            if (days && days === '1') {
                tidsbruk.normal.timer = hours;
                tidsbruk.normal.minutter = minutes;
            }
            this.set('tidsbruk', tidsbruk);
        }

    });

});
