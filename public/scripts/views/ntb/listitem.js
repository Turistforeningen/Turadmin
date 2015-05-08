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
        Template = require('text!templates/ntb/listitem.html'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');
    require('moment');

    // Module
    return Backbone.View.extend({

        template: _.template(Template),
        tagName: 'tr',
        className: 'clickable',

        events: {
            'click td.route-title': 'loadRoute',
            'click td.actions a.edit': 'loadRoute',
            'click [data-action="route-delete"]': 'deleteRoute',
            'click [data-action="route-delete-modal-open"]': 'openDeleteModal',
            'click [data-action="publish"]': 'publish',
            'click [data-action="unpublish"]': 'unpublish'
        },

        initialize : function (options) {
            this.path = options.path;
            this.model.on('destroy', this.removeItemView, this);
            _.bindAll(this, 'publish', 'unpublish');
        },

        loadRoute: function () {
            var url = '/' + this.path + '/' + this.model.get('id');
            window.location.href = url;
        },

        deleteRoute: function (e) {
            this.$('.modal').on('hidden.bs.modal', $.proxy(function (e) {
                this.model.destroy();
                this.render();
            }, this));

            this.$('.modal').modal('hide');
        },

        openDeleteModal: function (e) {
            this.$('.modal').modal('show');
        },

        publish: function () {
            // It is important to use PATCH here, to prevent overwriting object, as the model is not complete
            this.model.save({_method: 'PATCH', status: 'Offentlig'});
            this.render();
        },

        unpublish: function () {
            // NOTE: It is important to use PATCH here, to prevent overwriting object, as the model is not complete
            this.model.save({_method: 'PATCH', status: 'Kladd'});
            this.render();
        },

        removeItemView: function () {
            this.remove();
        },

        render: function () {
            if (!this.model) {
                this.remove();
            } else {
                var data = this.makeJsonModel();
                data.userIsAdmin = user.get('er_admin');
                var html = this.template(data);
                $(this.el).html(html);
            }
            return this;
        },

        makeJsonModel : function () {
            var json = this.model.toJSON();

            var publisert = 'Nei';
            if (this.model.get('status') === 'Offentlig') {
                publisert = 'Ja';
            }
            json.erPublisert = publisert;

            if (!!json.endret) {
                json.endret = moment(json.endret).format('DD.MM.YYYY [kl.] HH.mm');
            }
            return json;
        }
    });
});
