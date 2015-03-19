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

        type: 'route',
        idAttribute: '_id',
        forcedLicense: 'CC BY 4.0',

        defaults: {
            // navn: '', // Not set as default, because of validation
            // beskrivelse: '', // Not set as default, because of validation
            lenker: [],
            tidsbrukDager: '1',
            tidsbrukTimer: '1',
            tidsbrukMinutter: '0',
            tidsbruk: {normal: {dager: 1, timer: 1, minutter: 0}},
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
            'tilkomst',
            'tags',
            'privat',
            'grupper',
            'bilder',
            'steder',
            'rute',
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
            this.on('change:geojson', this.updateBoundaryIntersect, this);
            this.updateBoundaryIntersect();
            this.on('change:geojson', this.updateRouteDistance, this);

            var duration = this.get('tidsbruk');

            if (!!duration.normal) {
                this.set('tidsbrukDager', (!!duration.normal.dager) ? '' + duration.normal.dager : '1');
                this.set('tidsbrukTimer', (!!duration.normal.timer) ? '' + duration.normal.timer: '0');
                this.set('tidsbrukMinutter', (!!duration.normal.minutter) ? '' + duration.normal.minutter: '0');
            }

            this.set('turtype', this.getRouteType());
            this.set('flereTurtyper', this.getAdditionalRouteTypes());

            this.on('change:tilkomstGenerell', this.updateTilkomst, this);
            this.on('change:tilkomstKollektivtransport', this.updateTilkomst, this);
            this.on('change:tilkomstGenerell', this.setAdkomstFromTilkomst, this); // NOTE: Temp, while supporting both adkomst/kollektiv and tilkomst object
            this.on('change:tilkomstKollektivtransport', this.setKollektivFromTilkomst, this); // NOTE: Temp, while supporting both adkomst/kollektiv and tilkomst object

            this.initTilkomstFlat();

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

        initTilkomstFlat: function () {
            var tilkomst = this.get('tilkomst') || {};
            var tilkomstGenerell = tilkomst.generell || this.get('adkomst');
            var tilkomstKollektivtransport = tilkomst.kollektivtransport || this.get('kollektiv');

            this.set('tilkomstGenerell', tilkomstGenerell);
            this.set('tilkomstKollektivtransport', tilkomstKollektivtransport);
        },

        updateTilkomst: function (e) {
            var tilkomstGenerell = this.get('tilkomstGenerell');
            var tilkomstKollektivtransport = this.get('tilkomstKollektivtransport');

            var tilkomst = this.get('tilkomst') || {};
            tilkomst.generell = tilkomstGenerell;
            tilkomst.kollektivtransport = tilkomstKollektivtransport;
            this.set('tilkomst', tilkomst);
        },

        setAdkomstFromTilkomst: function () {
            var tilkomstGenerell = this.get('tilkomstGenerell');
            this.set('adkomst', tilkomstGenerell);
        },

        setKollektivFromTilkomst: function () {
            var tilkomstKollektivtransport = this.get('tilkomstKollektivtransport');
            this.set('kollektiv', tilkomstKollektivtransport);
        },

        updateBoundaryIntersect: function () {
            if (this.hasRoute()) {
                var geojson = this.get('geojson');
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json',
                    url: 'http://geoserver2.dotcloudapp.com/api/v1/boundary/intersect',
                    data: JSON.stringify({geojson: geojson}),
                    success: $.proxy(this.setBoundaryIntersect, this)
                });

            } else {
                this.setBoundaryIntersect({fylker: [], kommuner: [], 'områder': []});
            }
        },

        setBoundaryIntersect: function (data) {
            this.set('fylker', data['fylker']);
            this.set('kommuner', data['kommuner']);
            this.set('områder', _.pluck(data['områder'], '_id'));
            this.set('områder_navn', _.pluck(data['områder'], 'navn'));
        },

        updateRouteDistance: function () {
            if (this.hasRoute()) {
                var geojson = this.get('geojson');
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json',
                    url: 'http://geoserver2.dotcloudapp.com/api/v1/line/analyze',
                    data: JSON.stringify({geojson: geojson}),
                    success: $.proxy(function (data) {
                        this.set('distanse', data.length);
                    }, this)
                });

            } else {
                this.set('distanse', 0);
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

            this.updateStartpunkt();
            this.updateSeason();
            this.updateTidsbruk();

            // Remove geojson if empty
            if (!this.hasRoute()) {
                this.unset('geojson');
            }

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        },

        updateTidsbruk: function () {
            var days = parseInt(this.get('tidsbrukDager'), 10);
            var hours = parseInt(this.get('tidsbrukTimer'), 10);
            var minutes = parseInt(this.get('tidsbrukMinutter'), 10);
            var tidsbruk = {};

            if (days === 1) {
                tidsbruk.normal = {
                    timer: hours,
                    minutter: minutes
                };

            } else {
                tidsbruk.normal = {
                    dager: days,
                    timer: 0,
                    minutter: 0
                };
            }

            this.set('tidsbruk', tidsbruk);
        }

    });

});
