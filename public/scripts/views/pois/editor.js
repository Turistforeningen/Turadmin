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
    return NtbEditorView.extend({

        el: '[data-view="app"]',

        className: 'editor-poi',

        initialize: function (options) {

            // Set model for view
            this.model = new Poi(options.poiData);

            this.pictures = new PictureCollection(options.picturesData);

            this.relatedCollections = [
                {
                    field: 'bilder',
                    collection: this.pictures,
                    destroyRemoved: false
                }
            ];

            this.listenTo(this.model, 'change:status', this.updatePublishButtons);
            this.listenTo(this.model, 'change:synced', this.onSyncChange);

            NtbEditorView.prototype.initialize.call(this, options);

        },

        render: function () {

            $('body').scrollspy({target: '.navbar-app'});

            this.$el.addClass(this.className);

            this.poiPositioningView = new PoiPositioningView({
                model: this.model
            }).render();

            this.poiDetailsView = new PoiDetailsView({
                model: this.model
            }).render();

            this.pictureManagerView = new PictureManagerView({
                el: '[data-view="poi-pictures"]',
                pictures: this.pictures,
                defaults: {
                    geojson: this.model.get('geojson')
                },
                messages: {
                    empty: 'Husk å legge inn bilder fra stedet.'
                }
            }).render();

            // Render publish buttons
            this.updatePublishButtons();

        },

        publish: function() {

            var isValid = this.model.isValid(true);

            if (isValid === true) {
                this.pictures.setPublished(true);

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
            this.updatePublishButtons();
            this.save();
        }

    });

});
