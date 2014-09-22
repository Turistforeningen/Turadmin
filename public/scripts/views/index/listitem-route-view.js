/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.ListItemView = Backbone.View.extend({

        template: _.template($('#listRouteItemTemplate').html()),
        tagName: 'tr',
        className: 'clickable',

        events: {
            'click td.route-title': 'loadRoute',
            'click [data-action="route-delete"]': 'deleteRoute',
            'click [data-action="route-delete-modal-open"]': 'openDeleteModal',
            'click [data-action="route-publish"]': 'publishRoute',
            'click [data-action="route-unpublish"]': 'unpublishRoute'
        },

        initialize : function () {
            this.model.on('destroy', this.removeItemView, this);
            _.bindAll(this, 'publishRoute', 'unpublishRoute');
        },

        loadRoute: function () {
            var turId = this.model.get('_id');
            window.location = '/tur/' + turId;
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

        publishRoute: function () {
            // It is important to use PATCH here, to prevent overwriting object, as the model is not complete
            this.model.save({_method: 'PATCH', status: 'Offentlig'});
            this.render();
        },

        unpublishRoute: function () {
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
                var html = this.template(this.makeJsonModel());
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
                var date = new Date(Date.parse(json.endret));
                json.endret = date.toLocaleString();
            }
            return json;
        }
    });
}(DNT));
