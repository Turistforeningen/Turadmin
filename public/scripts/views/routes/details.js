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
        RouteModel = require('models/route'),
        LinksManagerView = require('views/links/manager'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');
    require('ckeditor-core');
    require('select2');

    // Module
    return Backbone.View.extend({

        turtyper: {
            'Fottur': ['Alpint', 'Bærtur', 'Fisketur', 'Fjelltur', 'Grottetur', 'Hyttetur', 'Skogstur', 'Sopptur', 'Telttur', 'Topptur', 'Trilletur'],
            'Skitur': ['Alpint', 'Hyttetur', 'Langrenn', 'Snowboard', 'Snøhuletur', 'Telemark', 'Telttur', 'Topptur'],
            'Sykkeltur': ['Downhillsykling', 'Landeveissykling', 'Terrengsykling'],
            'Padletur': ['Kajakktur', 'Kanotur'],
            'Bretur': ['Alpint', 'Hyttetur', 'Telttur', 'Topptur'],
            'Klatretur': ['Alpint', 'Telttur', 'Topptur']
        },

        passerForOptions: ['Barn', 'Voksen', 'Senior'],

        tilrettelagtForOptions: ['Barnevogn', 'Rullestol'],

        el: '[data-view="route-details"]',

        bindings: {
            '[name="route-details-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-details-field-beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-details-field-adkomst_generell"]': 'tilkomstPrivat',
            '[name="route-details-field-ankomst_kollektivtransport"]': 'tilkomstKollektivtransport',
            '[name="route-details-field-typetur"]': {
                observe: 'turtype',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-details-field-gradering"]': {
                observe: 'gradering',
                setOptions: {
                    validate: true
                }
            },
            'select.form-control.route-details-field-tidsbruk-normal-dager': 'tidsbrukDager',
            'select.form-control.route-details-field-tidsbruk-normal-timer': 'tidsbrukTimer',
            'select.form-control.route-details-field-tidsbruk-normal-minutter': 'tidsbrukMinutter',
            '.route-details-field-sesong input': {
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
                },
                setOptions: {
                    validate: true
                }
            },
            '[name="route-details-field-passer_for_barn"]': {
                observe: 'passer_for',
                onGet: 'onGetPasserForBarn',
                onSet: 'onSetPasserForBarn'
            }
        },

        events: {
            'click #checkbox_kollektivMulig': 'toggleKollektivFieldVisibility',
            'click #route-details-field-sesong-select-all': 'selectAllSeasons',
            'click #route-details-field-sesong-deselect-all': 'deselectAllSeasons',
            'click .route-details-field-sesong input[type="checkbox"]': 'updateSeasonSelection',
            'click .route-details-field-tags-primary label': 'setPrimaryTag'
        },

        initialize: function (options) {

            this.model = options.route || new RouteModel();

            this.model.on('change:navn', this.updateRouteNamePlaceholders, this);
            this.model.on('change:tidsbrukDager', this.toggleHoursAndMinutesVisiblity, this);
            this.model.on('change:turtype', this.updateFlereTurtyperOptions, this);

            // Bind these methods to this scope
            _.bindAll(this, 'onGetPasserForBarn', 'onSetPasserForBarn');

            this.user = user;

            if (!!this.model.get('navn') && this.model.get('navn').length > 0) {
                this.updateRouteNamePlaceholders();
            }

            if (!!this.model.get('tidsbrukDager')) {
                this.toggleHoursAndMinutesVisiblity();
            }

            if (this.model.getRouteType() !== '') {
                var $routeTypeElement = this.$('input[value="' + this.model.getRouteType() + '"]');
                $routeTypeElement.parent('label').addClass('active');
            }

            if (!!this.model.get('gradering')) {
                var $graderingElement = this.$('input[value="' + this.model.get('gradering') + '"]');
                $graderingElement.parent('label').addClass('active');
            }

            if (this.model.get('kollektiv') === '') {
                this.$('#route-details-field-ankomst_kollektivtransport_description').addClass('hidden');
            }

        },

        updateFlereTurtyperOptions: function () {

            if (!!this.model.get('turtype')) {
                $('.form-group.route-details-field-tags-other').removeClass('hidden');
            }

            var $flereTurtyperInput = this.$('[name="route-details-field-flere-typer"]');

            if ($flereTurtyperInput.hasClass('select2-offscreen')) {
                $flereTurtyperInput.select2('val', '');
                $flereTurtyperInput.select2('destroy');
            }

            var turtype = this.model.get('turtype');

            $flereTurtyperInput.select2({
                formatNoMatches: function () { return 'Type tur ikke valgt eller ingen treff'; },
                tags: (!!turtype && turtype !== '') ? this.turtyper[turtype] : [], // If turtype is not set, no tags are available
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereTurtyperChange, this));

        },

        onFlereTurtyperChange: function (e) {
            var flereTurtyper = e.val;
            this.model.set('flereTurtyper', flereTurtyper);
        },

        toggleHoursAndMinutesVisiblity: function () {
            var val = this.model.get('tidsbrukDager');
            if (val === '1') {
                this.$('.form-group.route-details-field-tidsbruk-normal-timer-minutter').removeClass('hidden');
            } else {
                this.$('.form-group.route-details-field-tidsbruk-normal-timer-minutter').addClass('hidden');
            }
        },

        toggleKollektivFieldVisibility: function (e) {
            if (e.currentTarget.checked) {
                this.$('#route-details-field-ankomst_kollektivtransport').removeClass('hidden');
                this.$('#route-details-field-ankomst_kollektivtransport_description').removeClass('hidden');
            } else {
                this.$('#route-details-field-ankomst_kollektivtransport').addClass('hidden');
                this.$('#route-details-field-ankomst_kollektivtransport_description').addClass('hidden');
                this.model.set('kollektiv', '');
            }
        },

        selectAllSeasons: function () {
            this.$('#route-details-field-sesong-deselect-all').removeClass('hidden');
            this.$('#route-details-field-sesong-select-all').addClass('hidden');
            this.model.set('sesong', [1,2,3,4,5,6,7,8,9,10,11,12]);
        },

        deselectAllSeasons: function () {
            this.$('#route-details-field-sesong-deselect-all').addClass('hidden');
            this.$('#route-details-field-sesong-select-all').removeClass('hidden');
            this.model.set('sesong', []);
        },

        updateSeasonSelection: function () {
            var checked = this.$('.route-details-field-sesong input[type="checkbox"]:checked');
            var seasons = [];
            for (var i = 0; i < checked.length; i =  i + 1) {
                var val = this.$(checked[i]).val();
                seasons.push(val);
            }

            this.model.set('sesong', seasons);

        },

        onGetPasserForBarn: function (val, options) {
            var passerFor = val || [];
            return (passerFor.indexOf('Barn') > -1) ? true : false;
        },

        onSetPasserForBarn: function (val, options) {
            var passerForBarn = val;
            return (passerForBarn === true) ? ['Barn'] : [];
        },

        updateRouteNamePlaceholders: function () {
            var routeName = this.model.get('navn');
            $('[data-placeholder-for="route-name"]').html(routeName);
        },

        render: function () {

            this.updateFlereTurtyperOptions();
            this.$('[name="route-details-field-flere-typer"]').select2('val', this.model.getAdditionalRouteTypes());

            $('input[name="route-details-field-tilrettelagt_for"]').select2({
                tags: this.tilrettelagtForOptions,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(function (e) {
                var tilrettelagt_for = e.val;
                this.model.set('tilrettelagt_for', tilrettelagt_for);
            }, this));

            this.$('[name="route-details-field-tilrettelagt_for"]').select2('val', this.model.get('tilrettelagt_for'));

            var userGroups = this.user.get('grupper');
            if (!!userGroups && userGroups.length > 0) {
                var select2Groups = [];

                for (var i = 0; i < userGroups.length; i++) {
                    select2Groups[i] = {};
                    select2Groups[i].id = userGroups[i].object_id;
                    select2Groups[i].text = userGroups[i].navn;
                }

                $('input[name="route-details-field-grupper"]').select2({
                    tags: select2Groups,
                    createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
                }).on('change', $.proxy(function (e) {
                    var routeGroups = e.val;
                    this.model.set('grupper', routeGroups);
                }, this));

                this.$('[name="route-details-field-grupper"]').select2('val', this.model.get('grupper'));

            } else {
                // If user does not belong to any groups, do not show groups field.
                this.$('.form-group.route-details-field-grupper').remove();
            }

            // Links Manager
            var linksManagerView = new LinksManagerView({
                model: this.model,
                linksField: 'lenker',
                el: '[data-view="route-details-lenker"]'
            }).render();


            // Beskrivelse
            var descriptionEditor = CKEDITOR.replace($('textarea[name="route-details-field-beskrivelse"]')[0], {
                language: 'no',
                // Define the toolbar groups as it is a more accessible solution.
                toolbarGroups: [
                    {name: 'basicstyles', groups: ['basicstyles']},
                    {name: 'paragraph', groups: ['list']},
                    {name: 'styles', groups: ['styles']},
                ],
                format_tags: 'p;h2;h3',
                // Remove the redundant buttons from toolbar groups defined above.
                removeButtons: 'Subscript,Superscript,Strike,Styles',
                // Remove elements path in footer
                removePlugins: 'elementspath'
            });

            descriptionEditor.on('change', $.proxy(function (e) {
                var data = e.editor.getData();
                this.model.set('beskrivelse', data);
            }, this));


            var publicTransportation = this.model.get('kollektiv');

            if (!!publicTransportation && publicTransportation.length > 0) {
                this.$('.route-details-field-ankomst_kollektivtransport input[type="checkbox"]').prop('checked', true);
                this.$('.route-details-field-ankomst_kollektivtransport textarea').removeClass('hidden');
            }

            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

            if ($('.route-details-field-sesong input[type="checkbox"]:not(:checked)').length === 0) {
                this.$('#route-details-field-sesong-deselect-all').removeClass('hidden');
                this.$('#route-details-field-sesong-select-all').addClass('hidden');
            }

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
});
