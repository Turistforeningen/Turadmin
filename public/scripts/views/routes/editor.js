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
        NtbEditorView = require('views/ntb/editor'),
        MapWrapper = require('views/map/wrapper'),
        RouteModel = require('models/route'),
        RouteDrawView = require('views/routes/draw'),
        PictureCollection = require('collections/pictures'),
        PictureManager = require('views/pictures/manager'),
        PoiCollection = require('collections/pois'),
        PoiManager = require('views/pois/manager'),
        MarkingModel = require('models/marking'),
        MarkingEdit = require('views/marking/edit'),
        RouteDetailsView = require('views/routes/details');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return NtbEditorView.extend({

        el: '[data-view="app"]',

        initialize: function (options) {

            // Create model
            this.model = new RouteModel(options.routeData);

            // Create collections
            this.pictures = new PictureCollection(options.picturesData);
            this.pois = new PoiCollection(options.poisData);

            this.relatedCollections = [
                {
                    field: 'bilder',
                    collection: this.pictures,
                    destroyRemoved: true
                },
                {
                    field: 'steder',
                    collection: this.pois,
                    destroyRemoved: true
                }
            ];

            if (this.model.get('rute')) {
                // Create models
                this.marking = new MarkingModel(options.routeData.rute);

                this.relatedModels = [
                    {
                        field: 'rute',
                        model: this.marking
                    }
                ];
            }

            // Set up views

            this.mapWrapper = new MapWrapper({
                el: '[data-view="route-map"]',
                route: this.model,
                pictures: this.pictures,
                pois: this.pois
            }).render();

            this.routeDrawView = new RouteDrawView({
                model: this.model,
                pictures: this.pictures,
                map: this.mapWrapper
            }).render();

            this.pictureManager = new PictureManager({
                el: '[data-view="route-pictures"]',
                pictures: this.pictures,
                map: this.mapWrapper,
                messages: {empty: 'Husk å legge inn bilder fra turen din, slik at det blir synlig på forsiden av UT.no'},
                defaults: {status: this.model.get('status')}
            }).render();

            this.poiManager = new PoiManager({
                el: '[data-view="route-pois"]',
                pois: this.pois,
                pictures: this.pictures,
                map: this.mapWrapper
            }).render();

            this.routeDetailsView = new RouteDetailsView({
                el: '[data-view="route-details"]',
                route: this.model
            }).render();

            if (this.model.get('rute')) {
                this.markingEdit = new MarkingEdit({
                    el: '[data-view="route-marking"]',
                    model: this.marking
                }).render();
            }

            this.listenTo(this.model, 'change:status', $.proxy(this.updatePublishButtons, this));

            NtbEditorView.prototype.initialize.call(this, options);
        },

        render: function () {
            $('body').scrollspy({target: '.navbar-app'});

            this.updatePublishButtons();
        },

        publish: function () {

            var isValid = this.model.isValid(true);

            if (isValid === true) {

                this.pictures.setPublished();
                this.pois.setPublished();

                this.model.set('status', 'Offentlig', {silent: true});

                this.save();

            } else {

                var doHide = 0;
                var hideTooltip = function () {
                    // NOTE: The first click event on publish button is fired twice. Because of that,
                    // the document click listener that will hide the tooltip can not be applied directly
                    // after the tooltip is shown, as that will cause the tooltip to be hidden on the "second"
                    // which is supposedly happening instantnly. That is the reason for this quite dirrrty hack.
                    if (doHide === 3) {
                        $('[data-action="do-publish"]').tooltip('hide');
                        $('[data-action="do-publish"]').on('hidden.bs.tooltip', function () {
                            $(document).off('click.tooltip');
                        });
                    }
                    doHide++;
                };

                $('[data-action="do-publish"]').on('shown.bs.tooltip', function () {
                    $(document).on('click.tooltip', $.proxy(function (e) {
                        hideTooltip();
                    }, this));
                });

                $('[data-action="do-publish"]').tooltip({
                    title: 'Stedet kan ikke publiseres uten at alle de påkrevde feltene er fylt ut.',
                    placement: 'bottom',
                    trigger: 'manual'
                }).tooltip('show');

                var $firstError = $('.has-error').first();

                $('html, body').animate({
                    scrollTop: ($firstError.offset().top - 80)
                }, 1000);
            }

            this.updatePublishButtons();

        },

        unpublish: function () {
            this.model.set('status', 'Kladd', {silent: true});
            this.pictures.setUnpublished();
            this.pois.setUnpublished();
            this.updatePublishButtons();
            this.save();
        }

    });

});
