/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/steder";
    };

    ns.Poi = Backbone.Model.extend({

        idAttribute: '_id',
        type: 'poi',
        changed: false,
        deleted: false,

        urlRoot: function () {
            return apiUri();
        },

        serverAttrs: [
            '_id',
            'beskrivelse',
            'bilder',
            'checksum',
            'endret',
            'geojson',
            'lisens',
            'navn',
            'privat',
            'status',
            'tags',
            'tilbyder'
        ],

        defaults: {
            navn: '',
            lisens: 'CC BY-NC 3.0 NO',
            status: 'Kladd',
            privat: {
                opprettet_av: {
                    id: 'someId'
                }
            },
            tags: []
        },

        validation: {
            navn:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            kategori:  function (val) {
                if (!val) {
                    return 'Dette feltet er påkrevd.';
                }
            },
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            }
        },

        initialize: function (attributes, options) {

            this.on('change', function () {
                this.changed = true;
            });

            this.positionChanged();

            this.on('change:navn', this.onNameChange, this);
            this.on('change:geojson', this.positionChanged);

            var tags = this.get('tags');
            if (tags.length > 0) {
                this.set('kategori', tags[0]);
            }

            this.on('change:kategori', function () {
                var tags = _.clone(this.get('tags')) || [];
                tags[0] = this.get('kategori');
                this.set('tags', tags);
            });

        },

        onNameChange: function (e) {
            this.trigger('registerPopover', {model: this, templateId: '#poiPopupTemplate'});
        },

        positionChanged: function () {
            if (this.hasPosition() && this.getMarker() === undefined) {
                this.createMarker(this.get('geojson'));
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
            return !!this.marker;
        },

        hasPosition: function () {
            var geojson = this.get("geojson");
            return !!geojson && !!geojson.coordinates;
        },

        setPublished: function(){
            this.set('status', 'Offentlig');
        },

        setUnpublished: function(){
            this.set('status', 'Kladd');
        },

        deletePoi: function () {
            this.set("deleted", true);
            this.trigger("deletePoi");
        },

        createMarker: function () {
            // console.log('poi:createMarker');
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
            this.trigger('registerPopover', {model: this, templateId: "#poiPopupTemplate"}); // This event is only signed up for on POI create, setupMarker in mapView, and not when marker is being drawn on route load
            marker.on("dragend", function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                this.updateGeojson(lat, lng);
            }, this);
            this.trigger("poi:markerCreated", this);
        },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set("geojson", geoJson);
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
