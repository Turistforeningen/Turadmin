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
        NtbCollection = require('collections/ntb'),
        Picture = require('models/picture');

    var apiUri = function () {
        return '/restProxy/bilder';
    };

    return NtbCollection.extend({

        url: function () {
            return apiUri();
        },

        model: Picture,

        comparator: function (model) {
            return model.get('ordinal');
        },

        nextOrdinal: 0,

        // initialize: function (pictures) {

        //     // this.on('add', this.onAdd, this);
        //     // this.on('remove', this.onRemove, this);

        //     this.nextOrdinal = 0;

        //     NtbCollection.prototype.initialize.call(this, pictures);
        // },

        getNextOrdinal: function () {
            this.nextOrdinal = this.nextOrdinal + 1;
            return this.nextOrdinal - 1;
        },

        onAdd: function (model) {

            NtbCollection.prototype.onAdd.apply(this, arguments);

            model.set('ordinal', this.getNextOrdinal());
            // model.on('deletePicture', function () { this.deletePicture(model); }, this); // deletePicture is fired from picture model.
        },

        // deletePicture: function (model) {
        //     this.remove(model);
        // },

        countPictures: function () {
            var count = this.filter(function (picture) {
                return !picture.isDeleted();
            });
            return count.length;
        },

        reIndex: function (picture, newPosition) {
            console.log('reindexing');
            this.remove(picture, {silent: true}); // NOTE: This causes a bug which removes the picture from POI picture list.
            picture.set('ordinal', newPosition);
            this.each(function (model, index) {
                var ordinal = index;
                if (index >= newPosition) {
                    ordinal = ordinal + 1;
                }
                model.set('ordinal', ordinal);
            });
            this.add(picture, {silent: true, at: newPosition});
            this.sort();
        },

        setPublished: function() {
            this.each(function (model, index) {
                model.setPublished();
            });
        },

        setUnpublished: function() {
            this.each(function (model, index) {
                model.setUnpublished();
            });
        }
    });
});
