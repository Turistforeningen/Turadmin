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
        Template = require('text!templates/map/popover.html');

    return Backbone.View.extend({

        initialize: function (options) {
            // var templateId = options.templateId;
            // this.template =  _.template($(templateId).html());
            var templateId = options.templateId;
            this.template =  _.template(Template);
            // Listen to URL changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on('change:thumbnailUrl', this.render, this);
            this.marker = options.marker;
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

            var marker = this.marker;
            var html =  this.template(this.model.toJSON());


            if (!!marker && !!html) {
                // console.log('binding popover', this.el, 'to marker', marker);
                var popup = L.popup({
                    autoPan: true,
                    autoPanPaddingTopLeft: L.point(100, 300), // NOTE: These L.point values may have to be adjusted. They are used because autoPan, which is supposed to make sure the popup is within the map viewport, does not work perfectly, because it does not know what size the popup will have.
                    autoPanPaddingBottomRight: L.point(150, 100)
                }).setContent(html);

                marker.bindPopup(popup);
                return this;
            }
        }
    });
});
