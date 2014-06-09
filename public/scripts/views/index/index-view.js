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
            this.user = user;

            _.bindAll(this, 'render');

            this.collection = new ns.RouteCollection();
            this.collection.on('reset', this.render);

            var provider = user.get('provider'),
                groups = user.get('grupper') || [],
                group;

            if (provider == 'DNT Connect' && groups.length) {
                this.groups = groups;
                this.fetchQuery = options.userDefaultRouteFetchQuery || {'privat.opprettet_av.id': user.get('id')}; // {'gruppe': _.first(groups).object_id}

            // } else if (provider = 'Mitt NRK') {
            } else {
                this.fetchQuery = {'privat.opprettet_av.id': user.get('id')};
            }

            this.fetchRoutes();

        },

        fetchRoutes: function () {
            this.collection.fetch({
                reset: true,
                data: this.fetchQuery
            });
        },

        onGroupChange: function (e) {
            var id = e.target.value;
            if (id == this.user.get('id')) {
                this.fetchQuery = {'privat.opprettet_av.id': id};
            } else {
                this.fetchQuery = {'gruppe': id};
            }
            this.fetchRoutes();

        },

        render: function () {
            var that = this;
            var userGroups = this.user.get('grupper');

            if (userGroups && userGroups.length > 0) {
                this.$('.group-select-container').removeClass('hidden');
                var groupSelect = new ns.SelectView({model: this.model, selectOptions: {user: this.user.get('id'), groups: this.groups}, selectValue: this.fetchQuery.gruppe});
                this.$('[data-placeholder-for="group-select"]').html(groupSelect.render().el).on('change', $.proxy(this.onGroupChange, this));
                this.$('[data-placeholder-for="group-select"] select').select2({formatNoMatches: function (term) { return 'Ingen treff'; } });
            }

            if (this.collection.length > 0) {
                that.$el.find('#listItems').empty();
                this.collection.each(function (route) {
                    var itemView = new ns.ListItemView({model: route});
                    that.$el.find("#listItems").append(itemView.render().el);
                });
                that.$('[data-placeholder-for="no-routes-alert"]').addClass('hidden');
                that.$('.routes-table').removeClass('hidden');

            } else {
                that.$('.routes-table').addClass('hidden');
                that.$('[data-placeholder-for="no-routes-alert"]').removeClass('hidden');
                that.$('[data-placeholder-for="no-routes-alert"]').html('<div class="alert alert-info"><strong>Ingen turer:</strong> Fant ingen turer tilhørende valgt bruker eller gruppe.</div>');
            }


        }

    });

}(DNT));
