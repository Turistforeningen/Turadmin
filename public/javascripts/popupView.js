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
            this.template = $('#popupTemplate').html();
        },

        events: {
        },

        render: function () {
            var marker = this.model.getMarker();
            marker.bindPopup(this.template);
        }
    });
}(DNT));
