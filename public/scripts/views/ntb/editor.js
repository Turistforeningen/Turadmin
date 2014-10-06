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
        PictureManagerView = require('views/pictures/manager'),
        PictureCollection = require('collections/pictures'),
        MapWrapper = require('views/map/wrapper'),
        Poi = require('models/poi'),
        PoiPositioningView = require('views/pois/positioning'),
        PoiDetailsView = require('views/pois/details');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return Backbone.View.extend({

        el: '[data-view="app"]',

        className: 'editor',

        events: {
            'click [data-action="do-save"]': 'save',
            'click [data-action="do-publish"]': 'publish',
            'click [data-action="do-unpublish"]': 'unpublish'
        },

        initialize: function (options) {
            this.listenTo(this, 'save:start', this.onSaveStart);
            this.listenTo(this, 'save:end', this.onSaveEnd);

            this.listenTo(this.model, 'change:synced', this.onSyncedChange);
        },

        onSyncedChange: function (model, value, options) {

            var synced = value,
                $saveButton = this.$('.navbar [data-action="do-save"]');

            switch (synced) {
                case true:
                    $saveButton.removeClass('has-unsaved-changes');
                    $saveButton.tooltip({title: ''});
                    $saveButton.tooltip('hide');
                    $saveButton.tooltip('disable');
                    $saveButton.removeClass('disabled');
                    break;

                case false:
                    $saveButton.addClass('has-unsaved-changes');
                    $saveButton.tooltip({title: 'Du har gjort endringer som ikke er lagret'});
                    $saveButton.tooltip('enable');
                    break;
            }

        },

        onSaveStart: function (e) {
            this.$('[data-action="do-save"]').addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');
        },

        onSaveEnd: function (e) {
            this.$('[data-action="do-save"]').removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
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

        onSyncChange: function (e) {
            if (this.model.get('synced') === false) {

            }
        },

        saveRelated: function (callback) {

            if (typeof this.relatedCollections !== 'undefined') {

                var saveDone = _.after(this.relatedCollections.length, $.proxy(callback, this));

                for (var i = 0; i < this.relatedCollections.length; i++) {

                    var relatedCollection = this.relatedCollections[i];

                    // console.log('Saving ' + relatedCollection.field);

                    relatedCollection.collection.save(
                        function () {
                            this.model.set(relatedCollection.field, relatedCollection.collection.pluck('_id'));
                            saveDone();
                            // console.log('All ' + relatedCollection.field + ' synced with server');
                        },
                        function (errorCount) {
                            // this.model.set(relatedCollection.field, relatedCollection.collection.pluck('_id'));
                            saveDone();
                            console.error('Failed to sync ' + errorCount + ' ' + relatedCollection.field);
                        },
                        this,
                        {destroyRemoved: relatedCollection.destroyRemoved}
                    );

                }

            } else {
                callback();
            }

        },

        save: function () {

            this.trigger('save:start');

            var afterPictureAndPoiSync = function () {

                this.model.save(undefined, {
                    success: $.proxy(function (e) {
                        this.trigger('save:end');
                    }, this),
                    error: $.proxy(function (e) {
                        console.error('error', e);
                        this.trigger('save:end');
                    }, this)
                });

            };

            this.saveRelated(afterPictureAndPoiSync);

        }

        // initialize: function (options) {

        //     // Set model for view
        //     this.model = new Poi(options.poiData);

        //     this.pictures = new PictureCollection(options.picturesData);

        //     this.listenTo(this, 'save:start', this.onSaveStart);
        //     this.listenTo(this, 'save:end', this.onSaveEnd);

        //     this.listenTo(this.model, 'change:status', this.updatePublishButtons);
        //     this.listenTo(this.model, 'change:synced', this.onSyncChange);

        //     this.defaults = options.defaults || {};

        // },

        // render: function () {

        //     $('body').scrollspy({target: '.navbar-app'});

        //     this.$el.addClass(this.className);

        //     this.poiPositioningView = new PoiPositioningView({
        //         model: this.model
        //     }).render();

        //     this.poiDetailsView = new PoiDetailsView({
        //         model: this.model
        //     }).render();

        //     this.pictureManagerView = new PictureManagerView({
        //         el: '[data-view="poi-pictures"]',
        //         pictures: this.pictures,
        //         defaults: {
        //             geojson: this.model.get('geojson')
        //         }
        //     }).render();

        //     // Render publish buttons
        //     this.updatePublishButtons();

        // },

        // onSyncChange: function (e) {
        //     if (this.model.get('synced') === false) {

        //     }
        // },

        // onSaveStart: function (e) {
        //     this.$('[data-action="do-save"]').addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');
        // },

        // onSaveEnd: function (e) {
        //     this.$('[data-action="do-save"]').removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
        // },

        // updatePublishButtons: function () {

        //     var status = this.model.get('status');

        //     switch (status) {
        //         case 'Kladd':
        //             $('[data-action="do-publish"]').removeClass('hidden');
        //             $('[data-action="do-unpublish"]').addClass('hidden');
        //             break;

        //         case 'Offentlig':
        //             $('[data-action="do-publish"]').addClass('hidden');
        //             $('[data-action="do-unpublish"]').removeClass('hidden');
        //             break;
        //     }
        // },

        // // updateSaveButton: function (allChangesSaved) {

        // //     var $saveButton = this.$('.navbar .route-save');

        // //     switch (allChangesSaved) {
        // //         case true:
        // //             $saveButton.removeClass('has-unsaved-changes');
        // //             $saveButton.tooltip({title: ''});
        // //             $saveButton.tooltip('hide');
        // //             $saveButton.tooltip('disable');
        // //             $saveButton.removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
        // //             break;

        // //         case false:
        // //             $saveButton.addClass('has-unsaved-changes');
        // //             $saveButton.tooltip({title: 'Du har gjort endringer som ikke er lagret'});
        // //             $saveButton.tooltip('enable');
        // //             break;
        // //     }

        // // },

        // // unsavedChanges: function(e) {
        // //     var routeModel = this.model.get('route'),
        // //         previousGeoJson = routeModel.previous('geojson'),
        // //         newGeoJson = routeModel.get('geojson');

        // //     // Prevent savebutton from indicating unsaved changes, on map init (which is setting model attribute geojson from undefined to empty route)
        // //     if (previousGeoJson && newGeoJson) {
        // //         this.updateSaveButton(false);
        // //     }
        // // },

        // publish: function() {

        //     var isValid = this.model.isValid(true);

        //     if (isValid === true) {
        //         this.pictures.setPublished(true);

        //         this.model.set('status', 'Offentlig', {silent: true});
        //         this.save();

        //     } else {

        //         var doHide = 0;
        //         var hideTooltip = function () {
        //             // NOTE: The first click event on publish button is fired twice. Because of that,
        //             // the document click listener that will hide the tooltip can not be applied directly
        //             // after the tooltip is shown, as that will cause the tooltip to be hidden on the "second"
        //             // which is supposedly happening instantnly. That is the reason for this quite dirrrty hack.
        //             if (doHide === 3) {
        //                 $('[data-action="do-publish"]').tooltip('hide');
        //                 $('[data-action="do-publish"]').on('hidden.bs.tooltip', function () {
        //                     $(document).off('click.tooltip');
        //                 });
        //             }
        //             doHide++;
        //         };

        //         $('[data-action="do-publish"]').on('shown.bs.tooltip', function () {
        //             $(document).on('click.tooltip', $.proxy(function (e) {
        //                 hideTooltip();
        //             }, this));
        //         });

        //         $('[data-action="do-publish"]').tooltip({
        //             title: 'Stedet kan ikke publiseres uten at alle de påkrevde feltene er fylt ut.',
        //             placement: 'bottom',
        //             trigger: 'manual'
        //         }).tooltip('show');

        //         var $firstError = $('.has-error').first();

        //         $('html, body').animate({
        //             scrollTop: ($firstError.offset().top - 80)
        //         }, 1000);
        //     }

        //     this.updatePublishButtons();

        // },

        // unpublish: function() {
        //     this.model.set('status', 'Kladd', {silent: true});
        //     this.updatePublishButtons();
        //     this.save();
        // },


    });

});
