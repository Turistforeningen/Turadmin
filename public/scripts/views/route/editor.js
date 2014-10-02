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
        MapWrapper = require('views/map/wrapper'),
        RouteModel = require('models/route'),
        RouteDrawView = require('views/route/draw'),
        PictureCollection = require('collections/pictures'),
        PictureManager = require('views/pictures/manager'),
        PoiCollection = require('collections/pois'),
        PoiManager = require('views/pois/manager'),
        RouteDetailsView = require('views/routes/details');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return Backbone.View.extend({

        el: $('[data-view="app"]'),
        // template: _.template(Template),

        initialize: function (options) {

            // Create model
            this.model = new RouteModel(options.routeData);

            // Create collections
            this.pictures = new PictureCollection(options.picturesData);
            this.pois = new PoiCollection(options.poisData);


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
                map: this.mapWrapper
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

            // Assign elements to variables
            this.$saveButton = this.$('.navbar .route-save');

            // Set up some event listeners
            $(document).on('click', '[data-action="do-save"]', $.proxy(this.save, this));
            $(document).on('click', '[data-action="do-publish"]', $.proxy(this.publish, this));
            $(document).on('click', '[data-action="do-unpublish"]', $.proxy(this.unpublish, this));

            // this.model.on('change:status', $.proxy(this.updatePublishButtons, this));
            this.listenTo(this.model, 'change:status', $.proxy(this.updatePublishButtons, this));
            // _.bindAll(this, 'publish', 'unpublish');
        },

        events: {
            // 'click [data-action="route-save"]': 'save',
            // 'click [data-action="do-publish"]': 'publish',
            // 'click [data-action="do-unpublish"]': 'unpublish'
        },

        render: function () {
            this.updatePublishButtons();
        },

        updatePublishButtons: function () {

            var status = this.model.get('status');

            switch (status) {
                case 'Kladd':
                    $('[data-action="do-publish"]').removeClass('hidden');
                    $('[data-action="do-unpublish"]').addClass('hidden');
                    break;

                case 'Offentlig':
                    $('[data-action="do-publish"]').addClass('hidden');
                    $('[data-action="do-unpublish"]').removeClass('hidden');
                    break;
            }
        },

        // updateSaveButton: function (allChangesSaved) {

        //     var $saveButton = this.$('.navbar .route-save');

        //     switch (allChangesSaved) {
        //         case true:
        //             $saveButton.removeClass('has-unsaved-changes');
        //             $saveButton.tooltip({title: ''});
        //             $saveButton.tooltip('hide');
        //             $saveButton.tooltip('disable');
        //             $saveButton.removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
        //             break;

        //         case false:
        //             $saveButton.addClass('has-unsaved-changes');
        //             $saveButton.tooltip({title: 'Du har gjort endringer som ikke er lagret'});
        //             $saveButton.tooltip('enable');
        //             break;
        //     }

        // },

        // unsavedChanges: function(e) {
        //     var routeModel = this.model.get('route'),
        //         previousGeoJson = routeModel.previous('geojson'),
        //         newGeoJson = routeModel.get('geojson');

        //     // Prevent savebutton from indicating unsaved changes, on map init (which is setting model attribute geojson from undefined to empty route)
        //     if (previousGeoJson && newGeoJson) {
        //         this.updateSaveButton(false);
        //     }
        // },

        publish: function() {

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

        unpublish: function() {
            this.model.set('status', 'Kladd', {silent: true});
            this.pictureCollection.setUnpublished();
            this.poiCollection.setUnpublished();
            this.updatePublishButtons();
            this.save();
        },

        save: function () {

            // var me = this;
            this.$saveButton.addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');

            var afterPictureAndPoiSync = function () {

                this.model.set('bilder', this.pictures.getPictureIds());
                this.model.set('steder', this.pois.getPoiIds());

                this.model.save(undefined, {
                    success: function () {
                        // this.updateSaveButton(true);
                        // this.updatePublishButtons();
                    },
                    error: function (e) {
                        console.error('error', e);
                    }
                });

            };

            var saveDone = _.after(2, $.proxy(afterPictureAndPoiSync, this));
            // var saveDone = _.after(1, $.proxy(afterPictureAndPoiSync, this));

            this.pois.save(
                function () {
                    saveDone();
                    console.log('All pois synced with server');
                },
                function (errorCount) {
                    saveDone();
                    console.error('Failed to sync ' + errorCount + ' pois');
                },
                this
            );

            this.pictures.save(
                function () {
                    saveDone();
                    console.log('All pictures synced with server');
                },
                function (errorCount) {
                    saveDone();
                    console.error('Failed to sync ' + errorCount + ' pictures');
                },
                this
            );

        }

    });

});
