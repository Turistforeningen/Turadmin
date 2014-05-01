/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PopoverView = Backbone.View.extend({

        initialize : function (options) {
            var templateId = options.templateId;
            this.template =  _.template($(templateId).html());
            // Listen to url changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on('change:thumbnailUrl', this.render, this);
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
            console.log('TODO: edit poi');
        },

        render: function () {
            var marker = this.model.getMarker();
            var html =  this.template(this.model.toJSON());

            if (!!marker && !!html) {
                $(this.el).html(html);
                marker.bindPopup(this.el);
                return this;
            }
        }
    });
}(DNT));
