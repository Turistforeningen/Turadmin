/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PoiPicturesView = Backbone.View.extend({

        template: _.template($('#poiPicturesTemplate').html()),

        events: {
            'click .thumbnail': 'toggleRelated'
        },

        initialize: function (options) {
            this.pictureCollection = options.pictureCollection;
            this.pictureCollection.on('change', function () {
                this.render();
            }, this);
        },

        toggleRelated: function (e) {

            var thumbnail = e.currentTarget;
            var pictureId = $(thumbnail).data('_id');

            var poiPictures = this.model.get('bilder') || [];
            var pictureInPoiIndex = _.indexOf(poiPictures, pictureId);

            if (pictureInPoiIndex > -1) {
                poiPictures.splice(pictureInPoiIndex, 1);
                console.log('removing');
                $(thumbnail).removeClass('selected');
            } else {
                poiPictures.push(pictureId);
                console.log('adding');
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

}(DNT));
