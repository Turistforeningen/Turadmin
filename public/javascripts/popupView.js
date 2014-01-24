/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PopupView = Backbone.View.extend({

        initialize : function () {
            this.templateElement = $('#popupTemplate').html();
        },

        events: {
        },

        render: function () {
            var marker = this.model.getMarker();
            var template = _.template(this.templateElement, this.model.toJSON());
            marker.bindPopup(template);
            return this;
        }
    });
}(DNT));
