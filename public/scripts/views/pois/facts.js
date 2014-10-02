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
        Backbone = require('backbone');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');

    // Module


    // var turtyper = {
    //     'Fottur': ['Alpint', 'Bærtur', 'Fisketur', 'Fjelltur', 'Grottetur', 'Hyttetur', 'Skogstur', 'Sopptur', 'Telttur', 'Topptur', 'Trilletur'],
    //     'Skitur': ['Alpint', 'Hyttetur', 'Langrenn', 'Snowboard', 'Snøhuletur', 'Telemark', 'Telttur', 'Topptur'],
    //     'Sykkeltur': ['Downhillsykling', 'Landeveissykling', 'Terrengsykling'],
    //     'Padletur': ['Kajakktur', 'Kanotur'],
    //     'Bretur': ['Alpint', 'Hyttetur', 'Telttur', 'Topptur'],
    //     'Klatretur': ['Alpint', 'Telttur', 'Topptur']
    // };

    // var passerForOptions = ['Barn', 'Voksen', 'Senior'];

    // var tilrettelagtForOptions = ['Barnevogn', 'Rullestol'];

    return Backbone.View.extend({

        el: '[data-view="poi-facts"]',

        bindings: {
            '[name="poi-facts-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="poi-facts-field-beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            }
        },

        events: {
            // 'click #checkbox_kollektivMulig': 'toggleKollektivFieldVisibility',
            // 'click #poi-facts-field-sesong-select-all': 'selectAllSeasons',
            // 'click #poi-facts-field-sesong-deselect-all': 'deselectAllSeasons',
            // 'click .poi-facts-field-sesong input[type="checkbox"]': 'updateSeasonSelection',
            // 'click .poi-facts-field-tags-primary label': 'setPrimaryTag'
        },



        initialize: function (options) {
            this.model.on('change:navn', this.updatePoiNamePlaceholders, this);
        },

        render: function () {

            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }
    });







        // updatePublishButtons: function () {

        //     var poiStatus = this.poi.get('status');

        //     switch (poiStatus) {
        //         case 'Kladd':
        //             this.$('[data-action="poi-publish"]').removeClass('hidden');
        //             this.$('[data-action="poi-unpublish"]').addClass('hidden');
        //             break;

        //         case 'Offentlig':
        //             this.$('[data-action="poi-publish"]').addClass('hidden');
        //             this.$('[data-action="poi-unpublish"]').removeClass('hidden');
        //             break;
        //     }
        // },

        // updateSaveButton: function (allChangesSaved) {

        //     var $saveButton = this.$('.navbar .poi-save');

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
        //     var poiModel = this.model.get('poi'),
        //         previousGeoJson = poiModel.previous('geojson'),
        //         newGeoJson = poiModel.get('geojson');

        //     // Prevent savebutton from indicating unsaved changes, on map init (which is setting model attribute geojson from undefined to empty poi)
        //     if (previousGeoJson && newGeoJson) {
        //         this.updateSaveButton(false);
        //     }
        // },

        // publish: function() {

        //     var isValid = this.poi.isValid(true);

        //     if (isValid === true) {
        //         this.pictureCollection.setPublished();
        //         this.poiCollection.setPublished();
        //         this.save();

        //     } else {

        //         var doHide = 0;
        //         var hideTooltip = function () {
        //             // NOTE: The first click event on publish button is fired twice. Because of that,
        //             // the document click listener that will hide the tooltip can not be applied directly
        //             // after the tooltip is shown, as that will cause the tooltip to be hidden on the "second"
        //             // which is supposedly happening instantnly. That is the reason for this quite dirty hack.
        //             if (doHide === 3) {
        //                 $('[data-action="poi-publish"]').tooltip('hide');
        //                 $('[data-action="poi-publish"]').on('hidden.bs.tooltip', function () {
        //                     $(document).off('click.tooltip');
        //                 });
        //             }
        //             doHide++;
        //         };

        //         $('[data-action="poi-publish"]').on('shown.bs.tooltip', function () {
        //             $(document).on('click.tooltip', $.proxy(function (e) {
        //                 hideTooltip();
        //             }, this));
        //         });

        //         $('[data-action="poi-publish"]').tooltip({
        //             title: 'Turen kan ikke publiseres uten at alle de påkrevde feltene er fyllt ut.',
        //             placement: 'bottom',
        //             trigger: 'manual'
        //         }).tooltip('show');

        //         var $firstError = $('.has-error').first();

        //         $('html, body').animate({
        //             scrollTop: ($firstError.offset().top - 80)
        //         }, 1000);
        //     }
        // },

        // unpublish: function() {
        //     this.poi.set('status', 'Kladd', { silent: true });
        //     this.pictureCollection.setUnpublished();
        //     this.poiCollection.setUnpublished();
        //     this.save();
        // },

//         save: function () {

//             this.$saveButton.addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');

//             // var afterPictureAndPoiSync = function () {

//                 // me.poi.setPoiIds(me.poiCollection.getPoiIds());
//                 // me.poi.setPictureIds(me.pictureCollection.getPictureIds());
// // debugger;
//                 this.model.save(undefined, {
//                     success: function () {
//                         // this.updateSaveButton(true);
//                         // this.updatePublishButtons();
//                     },
//                     error: function (e) {
//                         console.error('error', e);
//                     }
//                 });

//             // };

//             // var saveDone = _.after(2, afterPictureAndPoiSync);

//             // this.poiCollection.save(
//             //     function () {
//             //         saveDone();
//             //         console.log('All pois synced with server');
//             //     },
//             //     function (errorCount) {
//             //         saveDone();
//             //         console.error('Failed to sync ' + errorCount + ' pois');
//             //     },
//             //     this
//             // );

//             // this.pictureCollection.save(
//             //     function () {
//             //         saveDone();
//             //         console.log('All pictures synced with server');
//             //     },
//             //     function (errorCount) {
//             //         saveDone();
//             //         console.error('Failed to sync ' + errorCount + ' pictures');
//             //     },
//             //     this
//             // );

//         }

//     });

});
