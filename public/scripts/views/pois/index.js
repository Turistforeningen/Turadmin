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
        NtbIndexView = require('views/ntb/index'),
        ListItemView = require('views/pois/listitem'),
        PoiCollection = require('collections/pois');

    // Module
    return NtbIndexView.extend({
        collection: new PoiCollection(),

        fetchItems: function () {
            if (!this.collection.fetchQuery['tags.0']) {
                this.collection.fetchQuery['tags.0'] = '!Hytte';
            }
            NtbIndexView.prototype.fetchItems.call(this);
        },

        collectionContainsCabin: function () {
            // NOTE: This could probably be solved in a MUCH better way
            var collectionContainsCabin = {collectionContainsCabin: false};

            if (!!this.collection && !!this.collection.length) {
                _.each(this.collection, function (element, index, list) {
                    var model = list.models[0]; // element is undefined in argument list! o_O
                    if (model.hasTag('Hytte')) {
                        this.collectionContainsCabin = true;
                    }
                }, collectionContainsCabin);
            }

            return collectionContainsCabin.collectionContainsCabin;
        },

        render: function () {
            var collectionContainsCabin = this.collectionContainsCabin();
            if (collectionContainsCabin){
                $('[data-container-for="cabins-disabled-message"]').removeClass('hidden');
            } else {
                $('[data-container-for="cabins-disabled-message"]').addClass('hidden');
            }

            NtbIndexView.prototype.render.call(this);
        },

        renderListItem: function (poi) {
            var itemView = new ListItemView({model: poi, path: this.itemType});
            this.$el.find('[data-container-for="item-rows"]').append(itemView.render().el);
        },
    });

});
