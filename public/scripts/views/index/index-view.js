/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.IndexView = Backbone.View.extend({

        el: '#listContainer',

        initialize : function (options) {

            var mergedUserData = options.userData || {};
            mergedUserData.grupper = options.userGroups;
            var user = new ns.User(mergedUserData);

            _.bindAll(this, 'render');

            this.collection = new ns.RouteCollection();
            this.collection.on('reset', this.render);

            var provider = user.get('provider'),
                groups = user.get('groups') || [],
                group;

            if (provider == 'DNT Connect' && groups.length) {
                this.groups = groups;
                group = options.userDefaultGroup || _.first(groups).object_id;
                this.fetchQuery = {'gruppe': group};

            // } else if (provider = 'Mitt NRK') {
            } else {
                this.fetchQuery = {'privat.opprettet_av.id': user.get('id')};
            }
            // debugger;

            this.fetchRoutes();

        },

        fetchRoutes: function () {
            this.collection.fetch({
                reset: true,
                data: this.fetchQuery
            });
        },

        onGroupChange: function (e) {
            var groupId = e.target.value;
            this.fetchQuery = {'gruppe': groupId};
            this.fetchRoutes();

        },

        render: function () {
            var that = this;

            if (!!this.fetchQuery && !!this.fetchQuery.gruppe) {
                var groupSelect = new ns.SelectView({model: this.model, selectOptions: this.groups, selectValue: this.fetchQuery.gruppe});
                this.$('[data-placeholder-for="group-select"]').html(groupSelect.render().el).on('change', $.proxy(this.onGroupChange, this));
                this.$('[data-placeholder-for="group-select"] select').select2({formatNoMatches: function (term) { return 'Ingen treff'; } });
            }

            that.$el.find('#listItems').empty();

            this.collection.each(function (route) {
                var itemView = new ns.ListItemView({model: route});
                that.$el.find("#listItems").append(itemView.render().el);
            });

        }

    });

}(DNT));
