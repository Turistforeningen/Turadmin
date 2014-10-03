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
        LinksManagerView = require('views/links/manager'),
        User = require('models/user'),
        user = new User();

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('select2');

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

        el: '[data-view="poi-details"]',

        bindings: {
            '[name="poi-details-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="poi-details-field-beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="poi-details-field-type-sted"]': {
                observe: 'kategori',
                setOptions: {
                    validate: true
                }
            },
            '[data-placeholder-for="poi-name"]': 'navn'
        },

        tilrettelagtForOptions: ['Barnevogn', 'Rullestol'],


        // bindings: {
        //     '[name="navn"]': {
        //         observe: 'navn',
        //         setOptions: {
        //             validate: true
        //         }
        //     },
        //     '[name="beskrivelse"]': {
        //         observe: 'beskrivelse',
        //         setOptions: {
        //             validate: true
        //         }
        //     },
        //     '[name="kategori"]': {
        //         observe: 'kategori',
        //         setOptions: {
        //             validate: true
        //         }
        //     },
        //     '[data-placeholder-for="poi-name"]': 'navn'
        // },


        events: {
            // 'click #checkbox_kollektivMulig': 'toggleKollektivFieldVisibility',
            // 'click #poi-details-field-sesong-select-all': 'selectAllSeasons',
            // 'click #poi-details-field-sesong-deselect-all': 'deselectAllSeasons',
            // 'click .poi-details-field-sesong input[type="checkbox"]': 'updateSeasonSelection',
            // 'click .poi-details-field-tags-primary label': 'setPrimaryTag'
        },



        initialize: function (options) {
            this.model.on('change:navn', this.updatePoiNamePlaceholders, this);
            this.model.on('change:kategori', this.onKategoriChange, this);
        },

        render: function () {

            // Links Manager
            var linksManagerView = new LinksManagerView({
                model: this.model,
                linksField: 'lenker',
                el: '[data-view="poi-details-lenker"]'
            }).render();


            // Primary type
            var $primaryTagSelect = this.$('select[name="poi-details-field-type-sted"]');
            var availableCategories = this.model.availableCategories;
            var options = ['<option value="">Velg en</option>'];
            _.each(availableCategories, function (element, index, list) {
                this.push('<option value="' + element.name + '">' + element.name + '</option>');
            }, options);

            $primaryTagSelect.html(options);


            // More tags

            this.onKategoriChange(undefined, this.model.get('kategori')); // To render more-tags-field if kategori is already set in model.

            var poiTags = this.model.get('tags');
            var poiCategory = (poiTags.length > 0) ? poiTags[0] : '';
            var poiAdditionalCategories = (poiTags.length > 1) ? _.clone(poiTags) : [];

            poiAdditionalCategories.shift(); // Remove first item, as the first category is displayed in the field above "Er også"

            var alleStedKategorier = _.pluck(this.model.availableCategories, 'name');

            this.$('input[name="poi-details-field-flere-typer"]').select2({
                tags: alleStedKategorier,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereStedKategorierChange, this));

            this.$('input[name="poi-details-field-flere-typer"]').select2('val', poiAdditionalCategories);



            var tilrettelagtForOptions = this.tilrettelagtForOptions;

            $('input[name="poi-details-field-tilrettelagt_for"]').select2({
                tags: tilrettelagtForOptions,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(function (e) {
                var tilrettelagt_for = e.val;
                this.model.set('tilrettelagt_for', tilrettelagt_for);
            }, this));

            this.$('[name="poi-details-field-tilrettelagt_for"]').select2('val', this.model.get('tilrettelagt_for'));

            var userGroups = user.get('grupper');
            if (userGroups.length > 0) {
                var select2Groups = [];

                for (var i = 0; i < userGroups.length; i++) {
                    select2Groups[i] = {};
                    select2Groups[i].id = userGroups[i].object_id;
                    select2Groups[i].text = userGroups[i].navn;
                }

                $('input[name="poi-details-field-grupper"]').select2({
                    tags: select2Groups,
                    createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
                }).on('change', $.proxy(function (e) {
                    var routeGroups = e.val;
                    this.model.set('grupper', routeGroups);
                }, this));

                this.$('[name="poi-details-field-grupper"]').select2('val', this.model.get('grupper'));

            } else {
                // If user does not belong to any groups, do not show groups field.
                this.$('.form-group.poi-details-field-grupper').remove();
            }












            // Bind model to view
            this.stickit(); // Uses view.bindings and view.model to setup bindings

            // Validation
            Backbone.Validation.bind(this);

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        },

        onKategoriChange: function (e, value, stickit) {
            if (value) {
                $('div.form-group.poi-details-field-tags-other').removeClass('hidden');
            } else {
                $('div.form-group.poi-details-field-tags-other').addClass('hidden');
            }
        },

        onFlereStedKategorierChange: function (e) {
            var currentTags = this.model.get('tags');
            var category = (currentTags.length > 0) ? currentTags[0] : null;
            var additionalCategories = e.val;
            var allCategories = (category === null) ? additionalCategories : [category].concat(additionalCategories);
            this.model.set('tags', allCategories);
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
