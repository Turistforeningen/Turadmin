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
        PoiCollection = require('collections/pois'),
        ListModel = require('models/list'),
        ListDetailsView = require('views/lists/details'),
        ListPoisView = require('views/lists/pois');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return NtbEditorView.extend({

        el: '[data-view="app"]',

        initialize: function (options) {

            // Set up model
            this.model = new ListModel(options.listData);

            // Related collections that should be saved when saving list
            this.relatedCollections = [
                {
                    field: 'bilder',
                    collection: this.model.bilder,
                    destroyRemoved: true
                }
            ];

            // Set up views
            this.listDetailsView = new ListDetailsView({
                el: '[data-view="list-details"]',
                list: this.model,
                editor: this
            }).render();

            this.listPoisView = new ListPoisView({
                el: '[data-view="list-pois"]',
                list: this.model,
                pois: this.model.steder,
                editor: this
            }).render();

            // When status is changed, update publish buttons
            this.listenTo(this.model, 'change:status', $.proxy(this.updatePublishButtons, this));

            // Init super
            NtbEditorView.prototype.initialize.call(this, options);
        },

        render: function () {
            this.updatePublishButtons();
        },

        publish: function () {

            var isValid = this.model.isValid(true);

            if (isValid === true) {

                this.model.bilder.setPublished();
                this.model.steder.setPublished();

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
                    title: 'Lista kan ikke publiseres uten at alle de påkrevde feltene er fylt ut.',
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
            this.model.bilder.setUnpublished();
            this.model.steder.setUnpublished();
            this.updatePublishButtons();
            this.save();
        }

    });

});
