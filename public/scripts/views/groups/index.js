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
        User = require('models/user'),
        NtbIndexView = require('views/ntb/index'),
        ListItemView = require('views/groups/listitem'),
        GroupCollection = require('collections/groups');

    // Module
    return NtbIndexView.extend({
        collection: new GroupCollection(),
        defaultFetchQuery: (function() {
            var query = {sort: 'navn'};
            var user = new User();

            if (user.get('er_admin')) {
            } else {
                query['privat.brukere.id'] = user.get('id');
            }

            return query;
        })(),

        renderListItem: function (group) {
            var itemView = new ListItemView({model: group, path: this.itemType});
            this.$el.find('[data-container-for="item-rows"]').append(itemView.render().el);
        }
    });

});
