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
        NtbModel = require('models/ntb'),
        PopoverTemplate = require('text!templates/pois/popover.html');

    // Module
    return NtbModel.extend({

        idAttribute: '_id',
        type: 'poi',
        changed: false,
        deleted: false,
        popoverTemplate: PopoverTemplate,
        forcedLicense: 'CC BY-SA 4.0',

        urlRoot: function () {
            return '/restProxy/steder';
        },

        serverAttrs: [
            '_id',
            'beskrivelse',
            'bilder',
            'checksum',
            'endret',
            'fasiliteter',
            'fylke',
            'grupper',
            'geojson',
            'kommune',
            'lenker',
            'lisens',
            'navn',
            'navn_alt',
            'navngiving',
            'områder',
            'privat',
            'sesong',
            'status',
            'ssr_id',
            'tags',
            'tilbyder',
            'tilrettelagt_for',
            'åpen'
        ],

        defaults: {
            navn: '',
            lenker: [],
            lisens: 'CC BY-SA 4.0',
            status: 'Kladd',
            tags: [],
            markerIcon: '21'
        },

        validation: {
            navn: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            kategori: function (val) {
                if (!val) {
                    return 'Dette feltet er påkrevd.';
                }
            },
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            }
        },

        availableCategories: [
            {name: 'Akebakke', markerIcon: '38'},
            {name: 'Attraksjon', markerIcon: '35'},
            {name: 'Badeplass', markerIcon: '26'},
            {name: 'Bro', markerIcon: undefined},
            {name: 'Bu', markerIcon: '22'},
            {name: 'Fiskeplass', markerIcon: '27'},
            {name: 'Fjelltopp', markerIcon: '21'},
            {name: 'Gapahuk', markerIcon: '33'},
            {name: 'Geocaching', markerIcon: undefined},
            {name: 'Grotte', markerIcon: '35'},
            {name: 'Holdeplass', markerIcon: undefined},
            {name: 'Hytte', markerIcon: '22'},
            {name: 'Kitested', markerIcon: '40'},
            {name: 'Klatrefelt', markerIcon: '29'},
            {name: 'Parkering', markerIcon: undefined},
            {name: 'Rasteplass', markerIcon: '30'},
            {name: 'Servering', markerIcon: '34'},
            {name: 'Skitrekk', markerIcon: undefined},
            {name: 'Skiltpunkt', markerIcon: undefined},
            {name: 'Skøytevann', markerIcon: undefined},
            {name: 'Teltplass', markerIcon: '32'},
            {name: 'Toalett', markerIcon: undefined},
            {name: 'Togstasjon', markerIcon: undefined},
            {name: 'Turorientering', markerIcon: undefined},
            {name: 'Turpostkasse', markerIcon: undefined},
            {name: 'Utsiktspunkt', markerIcon: '25'},
            {name: 'Vadested', markerIcon: undefined}
        ],

        initialize: function (options) {

            this.on('change', function () {
                this.changed = true;
            });

            // this.on('change:navn', this.onNameChange, this);
            this.on('change:kategori', this.onCategoryChange, this);
            this.on('change:geojson', this.onGeoJsonChange, this);
            this.on('change:navn', this.onNameChange, this);
            this.on('change:geojson', this.updateBoundaryIntersect, this);
            this.updateBoundaryIntersect();

            var tags = this.get('tags');
            if (tags.length > 0) {
                this.set('kategori', tags[0]);
            }

            this.on('change:kategori', function () {
                var tags = _.clone(this.get('tags')) || [];
                tags[0] = this.get('kategori');
                this.set('tags', tags);
            });

            NtbModel.prototype.initialize.call(this, options);

        },

        onNameChange: function (e) {
            this.unset('ssr_id');
        },

        onCategoryChange: function (e) {
            var categoryName = this.get('kategori'),
                category = _.findWhere(this.availableCategories, {name: categoryName}),
                markerIcon;

            if (!!category && category.markerIcon) {
                markerIcon = category.markerIcon;

            } else if (!!this.defaults && this.defaults.markerIcon) {
                markerIcon = this.defaults.markerIcon;
            }

            this.set('markerIcon', markerIcon);

            // NOTE: Consider moving this to an onMarkerIconChange method.
            if (!!this.marker) {
                if (!!category) {
                    this.setMarkerIcon();
                }
            }
        },

        onGeoJsonChange: function (model, value, options) {
            if (this.hasMarker()) {
                try {
                    var latLng = L.latLng(this.getLatLng());
                    this.marker.setLatLng(latLng);
                } catch (e) {
                    Raven.captureException(e, {extra: {message: 'Could not create L.latLng'}});
                }
            }

            this.event_aggregator.trigger('poi:geoJsonChange', this);
            this.unset('ssr_id');
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

        getMarker: function () {
            return this.marker;
        },

        hasMarker: function () {
            return !!this.marker;
        },

        setMarkerIcon: function () {
            var iconName = this.get('markerIcon');

            var icon = L.icon({
                iconUrl: '/images/markers/' + iconName + '.png',
                iconRetinaUrl: '/images/markers/' + iconName + '@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });

            try {
                this.marker.setIcon(icon);
            }
            catch (e) {
                Raven.captureException(e, {extra: {message: 'Could not set marker icon'}});
            }
        },

        hasPosition: function () {
            var geojson = this.get('geojson');
            return !!geojson && !!geojson.coordinates;
        },

        // deletePoi: function () {
        //     this.set('deleted', true);
        //     this.trigger('deletePoi');
        // },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set('geojson', geoJson);
        },

        updateBoundaryIntersect: function () {
            if (this.hasPosition()) {
                var geojson = this.get('geojson');
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json',
                    url: 'https://geoserver.app.dnt.no/api/v1/boundary/intersect',
                    data: JSON.stringify({geojson: geojson}),
                    success: $.proxy(this.setBoundaryIntersect, this)
                });

            } else {
                this.setBoundaryIntersect({fylke: undefined, kommune: undefined, 'områder': []});
            }
        },

        setBoundaryIntersect: function (data) {
            if (data.fylker && data.fylker.length) {
                this.set('fylke', data.fylker[0]);
            }
            if (data.kommuner && data.kommuner.length) {
                this.set('kommune', data.kommuner[0]);
            }
            if (data['områder'] && data['områder'].length) {
                this.set('områder', _.pluck(data['områder'], '_id'));
                this.set('områder_navn', _.pluck(data['områder'], 'navn'));
            }
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
            this.updateSeason();

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        }
    });

});
