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
            'click td.route-title' : 'loadRoute',
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
            this.model.save({status: 'Offentlig'}, {patch: true});
            this.render();
        },

        unpublishRoute: function () {
            // NOTE: It is important to use PATCH here, to prevent overwriting object, as the model is not complete
            this.model.save({status: 'Kladd'}, {patch: true});
            this.render();
        },

        removeItemView: function () {
            this.remove();
        },

        render: function () {
            if (!this.model) {
                this.remove();
            } else {
                var html =  this.template(this.makeJsonModel());
                $(this.el).html(html);
            }
            return this;
        },

        makeJsonModel : function () {
            var json = this.model.toJSON();
            /*var missingDataArray = [];
            if (!this.model.get("geojson")) {
                missingDataArray.push("Inntegning");
            }
            if (!this.model.get("bilder") || this.model.get("bilder").length === 0) {
                missingDataArray.push("Bilder");
            }
            if (!this.model.get("beskrivelse") || this.model.get("beskrivelse").length === 0) {
                missingDataArray.push("Beskrivelse");
            }
            if (!this.model.get("sesong") || this.model.get("sesong").length === 0) {
                missingDataArray.push("Sesong");
            }
            if (!this.model.get("tags") || this.model.get("tags").length === 0) {
                missingDataArray.push("Turtype");
            }
            if (!this.model.get("gradering") || this.model.get("gradering").length === 0) {
                missingDataArray.push("Vanskelighetsgrad");
            }
            var missingData = "";
            var i;
            if (missingDataArray.length > 0) {
                for (i = 0; i < missingDataArray.length; i++) {
                    missingData += missingDataArray[i];
                    if (i !== missingDataArray.length - 1) {
                        missingData += ", ";
                    }
                }
            }
            json.mangler = missingData;*/

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
