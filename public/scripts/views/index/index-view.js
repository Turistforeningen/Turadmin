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
        isLoading: true,

        initialize : function (options) {
            var mergedUserData = options.userData || {};
            mergedUserData.grupper = options.userGroups;
            var user = new ns.User(mergedUserData);
            this.user = user;

            this.collection = new ns.RouteCollection();
            this.collection.on('reset', this.onRoutesFetched, this);

            var provider = user.get('provider'),
                groups = user.get('grupper') || [],
                group;

            if (provider == 'DNT Connect' && groups.length) {
                this.groups = groups;
                this.fetchQuery = options.userDefaultRouteFetchQuery || {'privat.opprettet_av.id': user.get('id')}; // {'gruppe': _.first(groups).object_id}

            } else if (provider == 'Innholdspartner') {
                group = user.get('gruppe');
                this.fetchQuery = (!!group && !!group._id) ? {gruppe: group._id} : {};

            } else {
                this.fetchQuery = {'privat.opprettet_av.id': user.get('id')};
            }

            this.fetchRoutes();
            this.render();
        },

        fetchRoutes: function () {
            this.isLoading = true;
            this.collection.fetch({
                reset: true,
                data: this.fetchQuery
            });
        },

        onRoutesFetched: function (e) {
            this.isLoading = false;
            this.render();
        },

        onGroupChange: function (e) {
            var id = e.target.value;
            if (id == this.user.get('id')) {
                this.fetchQuery = {'privat.opprettet_av.id': id};
            } else {
                this.fetchQuery = {'gruppe': id};
            }
            this.fetchRoutes();
            this.showLoading();
        },

        showLoading: function () {
            this.$('[data-container-for="loading-routes-message"]').removeClass('hidden')
            this.$('[data-container-for="loading-routes-message"]').html('<span>Laster turer...</span>');
            this.$('[data-container-for="no-routes-alert"]').addClass('hidden');
            this.$('[data-container-for="routes-table"]').addClass('hidden');
        },

        showRoutes: function () {
            this.$('[data-container-for="no-routes-alert"]').addClass('hidden');
            this.$('[data-container-for="loading-routes-message"]').addClass('hidden');
            this.$('[data-container-for="routes-table"]').removeClass('hidden');
        },

        showNoRoutes: function () {
            this.$('[data-container-for="loading-routes-message"]').addClass('hidden');
            this.$('[data-container-for="routes-table"]').addClass('hidden');
            this.$('[data-container-for="no-routes-alert"]').removeClass('hidden');
            this.$('[data-container-for="no-routes-alert"]').html('<div class="alert alert-info"><strong>Ingen turer:</strong> Fant ingen turer tilhørende valgt bruker eller gruppe.</div>');
        },

        render: function () {

            var userGroups = this.user.get('grupper');

            if (userGroups && userGroups.length > 0) {
                this.$('.group-select-container').removeClass('hidden');
                var groupSelect = new ns.SelectView({model: this.model, selectOptions: {user: this.user.get('id'), groups: this.groups}, selectValue: this.fetchQuery.gruppe});
                this.$('[data-placeholder-for="group-select"]').html(groupSelect.render().el).on('change', $.proxy(this.onGroupChange, this));
                this.$('[data-placeholder-for="group-select"] select').select2({formatNoMatches: function (term) { return 'Ingen treff'; } });
            }

            if (this.isLoading === true) {
                this.showLoading();
            } else if (this.collection.length > 0) {
                this.$el.find('#listItems').empty();
                this.collection.each(function (route) {
                    var itemView = new ns.ListItemView({model: route});
                    this.$el.find("#listItems").append(itemView.render().el);
                }, this);
                this.showRoutes();

            } else {
                this.showNoRoutes();
            }

        }

    });

}(DNT));
