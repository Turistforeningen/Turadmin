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
        GroupModel = require('models/group'),
        DetailsTemplate = require('text!templates/groups/details.html'),
        LinksManagerView = require('views/links/manager'),
        state = require('state'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');
    require('ckeditor-core');

    // Module
    return Backbone.View.extend({

        template: _.template(DetailsTemplate),

        availableTags: [
            'Kommune',
            'Fylkeskommune',
            'Bedrift',
            'Fotballag',
            'Idrettslag',
            'Interesseorganisasjon',
            'Kommune',
            'Nasjonalpark',
            'Orienteringslag',
            'Skole',
            'Turistinformasjon',
            'Speidergruppe'
        ],

        el: '[data-view="group-details"]',

        uploadUrl: 'https://jotunheimr.app.dnt.no/api/v1/upload',

        bindings: {
            '[name="group-details-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-details-field-url"]': {
                observe: 'url',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-details-field-epost"]': {
                observe: 'kontaktinfoEpost',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-details-field-beskrivelse"]': {
                observe: 'beskrivelse'
            },
            '[name="group-details-field-kategori"]': {
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

        events: {
            'click [data-dnt-action="remove-logo"]': 'removeLogo'
        },

        initialize: function (options) {

            this.model = options.group || new GroupModel();

            this.model.on('change:navn', this.updateGroupNamePlaceholders, this);
            this.model.on('change:logo', this.render, this);

            this.editor = options.editor;

            // Bind these methods to this scope
            _.bindAll(this, 'removeLogo');

            this.user = user;

        },

        render: function () {

            var html = this.template({model: this.model.toJSON(), availableTags: this.availableTags});
            this.$el.html(html);

            // Beskrivelse
            this.setupCkeditor();

            // Set up file upload button for uploading profile picture
            this.setupFileupload();

            // Links Manager
            var linksManagerView = new LinksManagerView({
                model: this.model,
                linksField: 'lenker',
                el: '[data-view="group-details-lenker"]'
            }).render();

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
            var descriptionEditor = CKEDITOR.replace($('textarea[name="group-details-field-beskrivelse"]')[0], {
                language: 'no',
                // Define the toolbar groups as it is a more accessible solution.
                toolbarGroups: [
                    {name: 'basicstyles', groups: ['basicstyles']},
                    {name: 'paragraph', groups: ['list']},
                    {name: 'styles', groups: ['styles']}
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

        setupFileupload: function () {
            var ended = false;
            var me = this;

            var fileUpload = this.$('#fileupload').fileupload({
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                sequentialUploads: true,
                url: this.uploadUrl,
                dataType: 'json',
                maxFileSize: 6000000,

                // On response from server
                done: function (e, data) {
                    var uploadedLogo = data && data.result && data.result[0];
                    var uploadedLogoOriginalVersion = uploadedLogo.versions[0];

                    me.model.set('logo', uploadedLogoOriginalVersion.url);
                },

                // On error
                fail: function (e, data) {
                    Raven.captureException(e, {extra: {message: 'Logo upload failed', data: data}});

                    me.editor.showNotification({
                        type: 'alert',
                        message: 'Det skjedde en feil under opplasting av bildet.'
                    });

                }
            });

            fileUpload.on('fileuploadprocessfail', function (e, data) {

                me.editor.showNotification({
                    type: 'alert',
                    message: 'Det skjedde en feil under opplasting av bildet. Pass på at filen ikke er større enn 6 MB.'
                });

            });

        },

        removeLogo: function () {
            this.model.unset('logo');
            this.render();
        }

    });
});
