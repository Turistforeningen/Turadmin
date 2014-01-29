/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PopupView = Backbone.View.extend({

        template: _.template($('#popupTemplate').html()),

        initialize : function () {
        },

        events: {
            'click .poi-delete': 'deletePoi',
            'click .poi-edit': 'editPoi'
        },

        deletePoi: function () {
            this.model.deletePoi();
            return false;
        },

        editPoi: function () {
            console.log("todo: edit poi");
            return false;
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
