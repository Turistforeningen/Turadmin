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
        Template = require('text!templates/ntb/listitem.html'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');
    require('moment');

    // Module
    return Backbone.View.extend({

        template: _.template(Template),
        tagName: 'tr',

        events: {
            'click [data-action="route-delete"]': 'deleteRoute',
            'click [data-action="route-delete-modal-open"]': 'openDeleteModal',
            'click [data-action="publish"]': 'publish',
            'click [data-action="unpublish"]': 'unpublish',
            'click [data-action="show-description"]': 'showDescription',
            'click [data-action="hide-description"]': 'hideDescription'
        },

        initialize: function (options) {
            this.path = options.path;
            this.model.on('destroy', this.removeItemView, this);
            _.bindAll(this, 'publish', 'unpublish', 'showDescription', 'hideDescription');
        },

        showDescription: function () {
            this.$('td.route-title').toggleClass('description-visible');
            this.$('td.route-title').toggleClass('description-hidden');
        },

        hideDescription: function () {
            this.$('td.route-title').toggleClass('description-visible');
            this.$('td.route-title').toggleClass('description-hidden');
        },

        getItemEditUrl: function () {
            return '/' + this.path + '/' + this.model.get('id');
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
                data.url = this.getItemEditUrl();
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

            json.beskrivelse = json.beskrivelse || '';

            json.erPublisert = publisert;
            json.erRute = !!json.rute;
            // json.harGeometri = (json.geojson && json.geojson.coordinates && json.geojson.coordinates.length);

            if (!!json.endret) {
                json.endret = moment(json.endret).format('DD.MM.YYYY [kl.] HH.mm');
            }
            return json;
        }
    });
});
