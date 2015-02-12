/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Template = require('text!templates/pois/positioning.html'),
        BoundaryIntersectTemplate = require('text!templates/pois/boundary.html'),
        MapWrapper = require('views/map/wrapper'),
        SsrSimpleView = require('views/ssr/simple');

    require('bootstrap');

    // Module
    return Backbone.View.extend({

        el: '[data-view="poi-positioning"]',
        template: _.template(Template),
        boundaryIntersectTemplate: _.template(BoundaryIntersectTemplate),

        initialize: function (options) {
            this.model = options.model;
            this.model.on('change:fylke', this.renderBoundaryIntersect, this);
            this.model.on('change:kommune', this.renderBoundaryIntersect, this);
            this.model.on('change:områder', this.renderBoundaryIntersect, this);
        },

        initPositionByCoordinates: function () {

        },

        initPositionByMarker: function () {

            var icon, marker;

            this.$initPositionByMarkerButton.addClass('hidden');
            this.$abortPositionByMarkerButton.removeClass('hidden');

            if (!!this.model.marker) {
                marker = _.clone(this.model.marker);
                icon = marker.options.icon;
                this.model.marker.setOpacity(0);

            } else {
                icon = new L.icon({
                    iconUrl: '/images/markers/0.png',
                    iconRetinaUrl: '/images/markers/0@2x.png',
                    iconSize: [26, 32],
                    iconAnchor: [13, 32],
                    popupAnchor: [-0, -30]
                });
            }

            this.drawMarkerTool = new L.Draw.Marker(this.mapWrapper.map, {
                icon: icon
            });

            this.drawMarkerTool.enable();
            this.mapWrapper.map.on('draw:created', this.onPositionByMarker, this);
            this.mapWrapper.map.on('draw:drawstop', this.onPositionByMarkerStop, this);
        },

        onPositionByMarker: function (e) {
            var type = e.layerType,
                layer = e.layer,
                latLng = layer.getLatLng(),
                lat = latLng.lat,
                lng = latLng.lng;

            if (type === 'marker') {
                this.model.setLatLng([lat, lng]);
            }
        },

        onPositionByMarkerStop: function () {
            this.$initPositionByMarkerButton.removeClass('hidden');
            this.$abortPositionByMarkerButton.addClass('hidden');
            this.model.marker.setOpacity(1);
        },

        abortPositionByMarker: function () {
            this.cancelDrawTool();
        },

        cancelDrawTool: function () {
            this.drawMarkerTool.disable();
        },

        renderPositionByCoordinatePopover: function () {

            this.$('[data-action="init-position-by-coordinates"]').popover({
                placement: 'bottom',
                title: 'Fyll inn koordinater manuelt',
                content: [
                    '<form class="form-inline" role="form">',
                        '<div class="form-group">',
                            '<div class="input-group">',
                              '<div class="input-group-addon">φ</div>',
                              '<input class="form-control" type="text" name="latitude" placeholder="Breddegrad">',
                            '</div>',
                        '</div>',
                        '<div class="form-group">',
                            '<div class="input-group">',
                              '<div class="input-group-addon">λ</div>',
                              '<input class="form-control" type="text" name="longitude" placeholder="Lengdegrad">',
                            '</div>',
                        '</div>',
                        '<button type="button" class="btn btn-primary" data-action="do-position-by-coordinates">Ferdig</button>',
                        '<button type="button" class="btn btn-default" data-action="abort-position-by-coordinates">Avbryt</button>',
                    '</form>'
                ].join(''),
                html: true
            });

            this.$('[data-action="init-position-by-coordinates"]').on('shown.bs.popover', $.proxy(function (e) {

                this.$('[data-action="do-position-by-coordinates"]').on('click', $.proxy(function (e) {
                    var latitude = this.$('.position-by-coordinates').find('input[name="latitude"]').val(),
                        longitude = this.$('.position-by-coordinates').find('input[name="longitude"]').val();

                    this.model.setLatLng([latitude, longitude]);

                    this.$('[data-action="init-position-by-coordinates"]').popover('hide');
                }, this));

                this.$('[data-action="abort-position-by-coordinates"]').on('click', $.proxy(function (e) {
                    this.$('[data-action="init-position-by-coordinates"]').popover('hide');
                }, this));

            }, this));

        },

        renderBoundaryIntersect: function () {
            this.$boundaryIntersect = $('[data-container-for="boundary-intersect"]');
            var html = this.boundaryIntersectTemplate({model: this.model.toJSON()});
            this.$boundaryIntersect.html(html);
        },

        render: function () {

            // var data = this.model.toJSON();
            var html = this.template();
            this.$el.html(html);

            this.$initPositionByMarkerButton = $('button[data-action="init-position-by-marker"]');
            this.$abortPositionByMarkerButton = $('button[data-action="abort-position-by-marker"]');

            this.$el.on('click', '[data-action="init-position-by-marker"]', $.proxy(this.initPositionByMarker, this));
            this.$el.on('click', '[data-action="abort-position-by-marker"]', $.proxy(this.abortPositionByMarker, this));
            this.$el.on('click', '[data-action="init-position-by-coordinates"]', $.proxy(this.initPositionByCoordinates, this));

            this.mapWrapper = new MapWrapper({poi: this.model});
            this.mapWrapper.render();

            this.ssr = new SsrSimpleView({
                callback: $.proxy(this.onPositionBySsr, this)
            });
            this.ssr.render();

            this.renderPositionByCoordinatePopover();

            return this;
        },

        onPositionBySsr: function (e) {
            var sted = e.added,
                ssrId = sted.ssrId,
                navn = sted.stedsnavn,
                lat = sted.nord,
                lng = sted.aust;

            this.model.setLatLng([lat, lng]);
            this.model.set('navn', navn);
            this.model.set('ssr_id', ssrId); // NOTE: Important to set SSR ID last, because changing position or name unsets ssr_id.
        }

    });

});
