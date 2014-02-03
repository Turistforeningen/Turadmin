/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PopupView = Backbone.View.extend({

        initialize : function (options) {
            var templateId = options.templateId;
            this.template =  _.template($(templateId).html());
        },

        events: {
            'click .popup-delete': 'deleteModel',
            'click .popup-edit': 'editModel'
        },

        deleteModel: function (e) {
            e.preventDefault();
            this.model.deletePoi();
        },

        editModel: function (e) {
            e.preventDefault();
            console.log("todo: edit poi");
        },

        render: function () {
            var marker = this.model.getMarker();
            var html =  this.template(this.model.toJSON());
            $(this.el).append(html);
            marker.bindPopup(this.el);
            return this;
        }
    });
}(DNT));
