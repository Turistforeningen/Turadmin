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
        }

    });

});
