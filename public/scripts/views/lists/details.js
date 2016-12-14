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
        moment = require('moment'),
        ListModel = require('models/list'),
        DetailsTemplate = require('text!templates/lists/details.html'),
        LinksManagerView = require('views/links/manager'),
        PictureManagerView = require('views/pictures/manager'),
        state = require('state'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');
    require('ckeditor-core');
    require('datepicker');
    require('datepicker-lang-no');

    // Module
    return Backbone.View.extend({

        template: _.template(DetailsTemplate),

        availableTags: [
            'SjekkUTDev'
        ],

        el: '[data-view="list-details"]',

        bindings: {
            '[name="list-details-field-navn"]': {
                observe: 'navn'
            },
            '[name="list-details-field-url"]': {
                observe: 'url'
            },
            '[name="list-details-field-beskrivelse"]': {
                observe: 'beskrivelse'
            },
            '[name="list-details-field-start"]': {
                observe: 'start',
                onGet: function(value) {
                    if (value) {
                        return moment(value).format('DD.MM.YYYY');
                    }
                },
                onSet: function(value) {
                    if (value) {
                        return moment(value, 'DD.MM.YYYY').toISOString();
                    }
                }
            },
            '[name="list-details-field-stopp"]': {
                observe: 'stopp',
                onGet: function(value) {
                    if (value) {
                        return moment(value).format('DD.MM.YYYY');
                    }
                },
                onSet: function(value) {
                    if (value) {
                        return moment(value, 'DD.MM.YYYY').toISOString();
                    }
                }
            },
            '[name="list-details-field-kategori"]': {
                observe: 'tags',
                setOptions: {
                    validate: true
                },
                onGet: function(value) {
                    // onGet called after tags change, and returns the first value in the array
                    return value[0];
                },
                onSet: function(value) {
                    // When input field value changes, set tags to an array with the
                    return [value];
                }
            }
        },

        events: {},

        initialize: function (options) {

            this.model = options.list || new ListModel();

            this.model.on('change:navn', this.updateListNamePlaceholders, this);
            this.model.on('sync', this.render, this);

            this.editor = options.editor;
            this.user = user;

        },

        render: function () {

            var html = this.template({
                model: this.model.toJSON(),
                availableTags: this.availableTags
            });
            this.$el.html(html);

            // Beskrivelse
            this.setupCkeditor();

            // Dates
            $('input[name="list-details-field-start"]').datepicker({
                forceParse: false, // AFAICS forceparse fails and causes existing date to be cleared when picker is dismissed
                format: 'dd.mm.yyyy',
                weekStart: 1,
                startDate: moment().format('DD.MM.YYYY'),
                language: 'no'
            });
            $('input[name="list-details-field-stopp"]').datepicker({
                forceParse: false, // AFAICS forceparse fails and causes existing date to be cleared when picker is dismissed
                format: 'dd.mm.yyyy',
                weekStart: 1,
                startDate: moment().format('DD.MM.YYYY'),
                language: 'no'
            });

            // Links Manager
            var linksManagerView = new LinksManagerView({
                model: this.model,
                linksField: 'lenker',
                el: '[data-view="list-details-lenker"]'
            }).render();

            // Pictures manager
            this.pictureManagerView = new PictureManagerView({
                el: '[data-view="list-pictures"]',
                pictures: this.model.bilder,
                stripped: true,
                messages: {
                    empty: 'Husk å legge inn bilder.',
                    info: 'Det første bildet vil bli brukt som hovedbilde i SjekkUT-appen.'
                },
                defaults: {
                    status: 'Offentlig'
                }
            }).render();

            this.setupGrupperSelect();

            // Set up view bindings and validation
            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

            return this;

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        },

        setupCkeditor: function () {
            var descriptionEditor = CKEDITOR.replace($('textarea[name="list-details-field-beskrivelse"]')[0], {
                language: 'no',
                // Define the toolbar groups as it is a more accessible solution.
                toolbarGroups: [
                    {name: 'basicstyles', groups: ['basicstyles']},
                    {name: 'paragraph', groups: ['list']},
                    {name: 'styles', groups: ['styles']},
                    {name: 'links'}
                ],
                format_tags: 'p;h2;h3',
                // Remove the redundant buttons from toolbar groups defined above.
                removeButtons: 'Subscript,Superscript,Strike,Styles',
                // Remove elements path in footer
                removePlugins: 'elementspath',
                // Whether to use HTML entities in the output.
                entities: false
            });

            descriptionEditor.on('change', $.proxy(function (e) {
                var data = e.editor.getData();
                this.model.set('beskrivelse', data);
            }, this));
        },

        setupGrupperSelect: function () {
            var userGroups = user.get('grupper');
            if (userGroups.length > 0) {
                var select2Groups = [];

                for (var j = 0; j < userGroups.length; j++) {
                    select2Groups[j] = {};
                    select2Groups[j].id = userGroups[j].object_id;
                    select2Groups[j].text = userGroups[j].navn;
                }

                $('input[name="list-details-field-grupper"]').select2({
                    tags: select2Groups,
                    createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
                }).on('change', $.proxy(function (e) {
                    var routeGroups = e.val;
                    this.model.set('grupper', routeGroups);
                }, this));

                this.$('[name="list-details-field-grupper"]').select2('val', this.model.get('grupper'));

            } else {
                // If user does not belong to any groups, do not show groups field.
                this.$('.form-group.list-details-field-grupper').remove();
            }
        }

    });
});
