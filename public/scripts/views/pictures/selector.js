/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Template = require('text!templates/pictures/selector.html'),
        PictureModel = require('models/picture'),
        PictureCollection = require('collections/pictures'),
        User = require('models/user'),
        user = new User();

    // Module
    return Backbone.View.extend({

        el: '[data-view="pictures-selector"]',

        template: _.template(Template),

        events: {
            'click .thumbnail': 'toggleRelated'
        },

        initialize: function (options) {
            this.pictureCollection = options.pictures;
            this.pictureCollection.on('add', this.render, this);
            this.pictureCollection.on('remove', this.render, this);
            this.pictureCollection.on('sort', this.render, this);
            this.pictureCollection.on('change:_id', this.render, this);
        },

        toggleRelated: function (e) {

            var thumbnail = e.currentTarget;
            var pictureId = $(thumbnail).data('_id');

            var poiPictures = this.model.get('bilder') || [];
            var pictureInPoiIndex = _.indexOf(poiPictures, pictureId);

            if (pictureInPoiIndex > -1) {
                poiPictures.splice(pictureInPoiIndex, 1);
                $(thumbnail).removeClass('selected');
            } else {
                poiPictures.push(pictureId);
                $(thumbnail).addClass('selected');
            }

            this.model.set('bilder', poiPictures);

        },

        isSelected: function (picture, view) {
            view = view || this;

            var pictureId = picture.id;
            var poiPictures = view.model.get('bilder') || [];

            if (_.indexOf(poiPictures, pictureId) > -1) {
                return 'selected';
            }
        },

        render: function () {
            var data = _.extend({ output: this.pictureCollection, isSelected: this.isSelected, scope: this });
            this.$el.html(this.template(data));
            return this;
        }

    });

});
