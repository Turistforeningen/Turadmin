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
        GroupModel = require('models/group'),
        GroupDetailsView = require('views/groups/details'),
        GroupUsersView = require('views/groups/users');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return NtbEditorView.extend({

        el: '[data-view="app"]',

        initialize: function (options) {

            // Set up model
            this.model = new GroupModel(options.groupData);


            // Set up views

            this.groupDetailsView = new GroupDetailsView({
                el: '[data-view="group-details"]',
                group: this.model,
                editor: this
            }).render();

            this.groupUsersView = new GroupUsersView({
                el: '[data-view="group-users"]',
                group: this.model,
                editor: this
            }).render();

            this.on('save:end', function (e) {
                this.groupUsersView.render();
            }, this);


            // Init super
            NtbEditorView.prototype.initialize.call(this, options);
        },

        publish: function() {

            var isValid = this.model.isValid(true);

            if (isValid === true) {
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
                    title: 'Gruppa kan ikke publiseres uten at alle de påkrevde feltene er fylt ut.',
                    placement: 'bottom',
                    trigger: 'manual'
                }).tooltip('show');

                var $firstError = $('.has-error').first();

                if ($firstError.length) {
                    $('html, body').animate({
                        scrollTop: ($firstError.offset().top - 80)
                    }, 1000);
                }
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
