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
        SelectView = require('views/select'),
        ListItemView = require('views/ntb/listitem'),
        PaginationTemplate = require('text!templates/ntb/pagination.html');

    require('select2');

    return Backbone.View.extend({

        el: '[data-container-for="items"]',
        isLoading: true,

        events: {
            'click [data-paginator]': 'paginate',
            'click [data-action="search"]': 'doSearch',
            'change [data-filter="type"]': 'onFilterTypeChange',
            'change [data-filter="omrade"]': 'onFilterOmraderChange'
        },

        initialize: function (options) {
            var mergedUserData = options.userData || {};
            mergedUserData.grupper = options.userGroups;
            var user = new User(mergedUserData);
            this.user = user;

            this.itemType = options.itemType;

            this.collection.on('reset', this.onItemsFetched, this);

            _.bindAll(this, 'paginate', 'doSearch', 'onFilterTypeChange', 'onFilterOmraderChange');

            var provider = user.get('provider'),
                groups = user.get('grupper') || [],
                group;

            if (provider == 'DNT Connect' && groups.length) {
                this.groups = groups;
                this.collection.fetchQuery = options.userDefaultRouteFetchQuery || {'privat.opprettet_av.id': user.get('id')};

            } else if (provider == 'Innholdspartner') {
                group = user.get('gruppe');
                this.collection.fetchQuery = (!!group) ? {gruppe: group} : {};

            } else {
                this.collection.fetchQuery = {'privat.opprettet_av.id': user.get('id')};
            }

            this.fetchItems();
            this.render();
        },

        onFilterOmraderChange: function (e) {
            var omrade = e.target.value;
            this.collection.setFilterOmrader(omrade);
        },

        onFilterTypeChange: function (e) {
            var type = e.target.value;
            this.collection.setFilterType(type);
        },

        onFilterEierChange: function (e) {
            var id = e.target.value;
            this.collection.setFilterEier(id);
        },

        fetchItems: function () {
            this.isLoading = true;

            this.collection.fetchQuery.sort = '-endret';

            this.collection.fetch({
                reset: true,
                data: this.collection.fetchQuery
            });
        },

        onItemsFetched: function (e) {
            this.isLoading = false;
            this.render();
        },

        paginate: function (e) {
            var page = $(e.target).data('paginator');
            this.collection.state.currentPage = page;
            this.fetchQuery.skip = (page - 1) * this.collection.state.pageSize;
            this.fetchItems();
        },

        doSearch: function () {
            var term = this.$el.find('[name="search-term"]').val();
            this.collection.setFilterNavn(term);
        },

        clearSearch: function () {
            this.$el.find('[name="search-term"]').val('');
        },

        showLoading: function () {
            this.$('[data-container-for="loading-items-message"]').removeClass('hidden');
            this.$('[data-container-for="no-items-alert"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').addClass('hidden');
            this.$('[data-container-for="paginator"]').addClass('hidden');
        },

        showRoutes: function () {
            this.$('[data-container-for="no-items-alert"]').addClass('hidden');
            this.$('[data-container-for="loading-items-message"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').removeClass('hidden');
            this.$('[data-container-for="paginator"]').removeClass('hidden');

        },

        showNoRoutes: function () {
            this.$('[data-container-for="loading-items-message"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').addClass('hidden');
            this.$('[data-container-for="no-items-alert"]').removeClass('hidden');
            this.$('[data-container-for="paginator"]').addClass('hidden');

        },

        showSearchTerm: function (searchTerm) {
            this.$('[data-container-for="search-term-info"]').removeClass('hidden');
            this.$('[data-container-for="search-term-info"]').find('[data-placeholder-for="search-term"]').text(searchTerm);
        },

        hideSearchTerm: function () {
            this.$('[data-container-for="search-term-info"]').addClass('hidden');
        },

        renderListItem: function (model) {
            var itemView = new ListItemView({model: model, path: this.itemType});
            this.$el.find('[data-container-for="item-rows"]').append(itemView.render().el);
        },

        render: function () {

            var userGroups = this.user.get('grupper');

            if (this.user.get('provider') === 'DNT Connect') {

                if (this.user.get('er_dnt_gruppe_medlem') === true) {
                    this.$('.filters-and-search .filters').removeClass('hidden');
                }

                if (userGroups && userGroups.length > 0) {
                    this.$('.group-select-container').removeClass('hidden');
                    var groupSelect = new SelectView({
                        model: this.model,
                        selectOptions: {
                            user: this.user.get('id'),
                            groups: this.groups,
                            admin: this.user.get('admin'),
                            itemType: this.itemType
                        }, selectValue: this.collection.fetchQuery['gruppe'] || this.collection.fetchQuery['privat.opprettet_av.id'] || 'alle'
                    });

                    this.$('[data-placeholder-for="group-select"]').off('change.groupselect');
                    this.$('[data-placeholder-for="group-select"] select').select2('destroy');
                    this.$('[data-placeholder-for="group-select"]')
                        .html(groupSelect.render().el)
                        .on('change.groupselect', $.proxy(this.onFilterEierChange, this));
                    this.$('[data-placeholder-for="group-select"] select').select2({
                        formatNoMatches: function (term) { return 'Ingen treff'; }
                    });

                } else {
                    this.$('.no-groups-info').removeClass('hidden');
                }
            }

            if (this.isLoading === true) {
                this.showLoading();
            } else if (this.collection.length > 0) {
                this.$el.find('[data-container-for="item-rows"]').empty();
                this.collection.each(function (route) {
                    this.renderListItem(route);
                }, this);
                this.showRoutes();

            } else {
                this.showNoRoutes();
            }

            if (!!this.collection.fetchQuery && !!this.collection.fetchQuery.navn) {
                this.showSearchTerm(this.collection.fetchQuery.navn.replace(/~/gi, ''));
            } else {
                this.hideSearchTerm();
            }

            this.renderPaginator();

        },

        renderPaginator: function () {
            var html = '';

            if (this.collection.state.paginatorRequired) {
                var template = _.template(PaginationTemplate);
                html = template({state: this.collection.state});
            }

            this.$('[data-container-for="paginator"]').html(html);
        }

    });

});
