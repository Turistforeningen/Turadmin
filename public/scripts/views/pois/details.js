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
    return Backbone.View.extend({

        events: {
            'click #poi-details-field-sesong-select-alle': 'selectSesongAlle',
            'click #poi-details-field-sesong-select-sommer': 'selectSesongSommer',
            'click #poi-details-field-sesong-select-vinter': 'selectSesongVinter',
            'click .poi-details-field-sesong input[type="checkbox"]': 'updateSeasonSelection',
        },

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
            '[data-placeholder-for="poi-name"]': 'navn',

            '.poi-details-field-sesong input': {
                observe: 'sesong',
                onGet: function(val) {
                    if (!!val && val.length) {
                        for (var i = 0; i < val.length; i++) {
                            // Validation need month number as string, to compare with field value
                            val[i] = '' + val[i];
                        }
                    }
                    return val;
                },
                onSet: function(val) {
                    // Season month conversion to integer is moved to route.js model
                    // for (var i = 0; i < val.length; i++) {
                    //     val[i] = parseInt(val[i], 10);
                    // }
                    return val;
                }
            },
            '[name="poi-details-field-åpen"]': {
                observe: 'åpen'
            }
        },

        tilrettelagtForOptions: ['Barnevogn', 'Rullestol'],

        initialize: function (options) {
            this.model.on('change:kategori', this.onKategoriChange, this);
            this.model.on('change:sesong', this.onSesongChange, this);
            this.listenTo(this.model, 'change:navn', this.updatePoiNamePlaceholders);
        },

        selectSesongAlle: function () {
            this.model.set('sesong', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        },

        selectSesongVinter: function () {
            this.model.set('sesong', [1, 2, 3, 10, 11, 12]);
        },

        selectSesongSommer: function () {
            this.model.set('sesong', [4, 5, 6, 7, 8, 9]);
        },

        updateSesongModel: function () {
            var checked = this.$('.poi-details-field-sesong input[type="checkbox"]:checked');
            var seasons = [];
            for (var i = 0; i < checked.length; i =  i + 1) {
                var val = this.$(checked[i]).val();
                seasons.push(val);
            }

            this.model.set('sesong', seasons);
        },

        render: function () {

            // POI name
            if (!!this.model.get('navn') && this.model.get('navn').length > 0) {
                this.updatePoiNamePlaceholders();
            }

            // Links Manager
            var linksManagerView = new LinksManagerView({
                model: this.model,
                linksField: 'lenker',
                el: '[data-view="poi-details-lenker"]',
                cols: 7,
                fields: ['tittel', 'url']
            }).render();


            // Tags

            // Primary type

            var alleStedKategorier = _.pluck(this.model.availableCategories, 'name');
            var selectableStedKategorier = _.without(alleStedKategorier, 'Hytte');

            var $primaryTagSelect = this.$('select[name="poi-details-field-type-sted"]');

            var options = ['<option value="">Velg en</option>'];
            for (var i = 0; i < selectableStedKategorier.length; i++) {
                options.push('<option value="' + selectableStedKategorier[i] + '">' + selectableStedKategorier[i] + '</option>');
            }

            $primaryTagSelect.html(options);

            // More tags

            this.onKategoriChange(undefined, this.model.get('kategori')); // To render more-tags-field if kategori is already set in model.

            var poiTags = this.model.get('tags');
            var poiCategory = (poiTags.length > 0) ? poiTags[0] : '';
            var poiAdditionalCategories = (poiTags.length > 1) ? _.clone(poiTags) : [];

            poiAdditionalCategories.shift(); // Remove first item, as the first category is displayed in the field above "Er også"

            this.$('input[name="poi-details-field-flere-typer"]').select2({
                tags: selectableStedKategorier,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereStedKategorierChange, this));

            this.$('input[name="poi-details-field-flere-typer"]').select2('val', poiAdditionalCategories);


            this.toggleÅpningstiderFields();

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

                for (var j = 0; j < userGroups.length; j++) {
                    select2Groups[j] = {};
                    select2Groups[j].id = userGroups[j].object_id;
                    select2Groups[j].text = userGroups[j].navn;
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

        updatePoiNamePlaceholders: function () {
            var poiName = this.model.get('navn');
            $('[data-container-for="navn"]').html(poiName);
        },

        onKategoriChange: function (e, value, stickit) {
            if (value) {
                $('div.form-group.poi-details-field-tags-other').removeClass('hidden');
            } else {
                $('div.form-group.poi-details-field-tags-other').addClass('hidden');
            }

            this.toggleÅpningstiderFields();
        },

        toggleÅpningstiderFields: function () {
            // Toggle fields sesong and åpen
            if (['Attraksjon', 'Badeplass', 'Bro', 'Parkering', 'Servering', 'Skitrekk', 'Teltplass', 'Toalett'].indexOf(this.model.get('kategori')) === -1) {
                // Sesong and åpen should not be available
                this.model.set({
                    åpen: undefined,
                    sesong: undefined
                });

                $('div.form-group.poi-details-field-sesong').addClass('hidden');
                $('div.form-group.poi-details-field-open').addClass('hidden');
                $('div.info-type-sesong-enabled').addClass('hidden');


            } else {
                // Sesong and åpen should be available
                $('div.form-group.poi-details-field-sesong').removeClass('hidden');
                $('div.form-group.poi-details-field-open').removeClass('hidden');
                $('div.info-type-sesong-enabled').removeClass('hidden');
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

});
