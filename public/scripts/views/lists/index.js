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
        ListItemView = require('views/lists/listitem'),
        ListCollection = require('collections/lists');

    // Module
    return NtbIndexView.extend({
        collection: new ListCollection(),
        defaultFetchQuery: {
            sort: 'opprettet'
        },

        renderListItem: function (list) {
            var itemView = new ListItemView({model: list, path: this.itemType});
            this.$el.find('[data-container-for="item-rows"]').append(itemView.render().el);
        }
    });

});
