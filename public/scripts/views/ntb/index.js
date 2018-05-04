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
        PaginationTemplate = require('text!templates/ntb/pagination.html'),
        state = require('state');

    require('select2');

    return Backbone.View.extend({

        el: '[data-container-for="items"]',
        isLoading: true,
        defaultFetchQuery: undefined, // Will be set in initialize method after user is initialized

        events: {
            'click [data-paginator]': 'paginate',
            'click [data-action="search"]': 'doSearch',
            'click [data-action="filters-and-search-clear"]': 'clearFiltersAndSearch',
            'click [data-action="sortable-toggle"]': 'sortByChanged',
            'click [data-action="show-all-descriptions"]': 'showAllDescriptions',
            'click [data-action="hide-all-descriptions"]': 'hideAllDescriptions',
            'change [data-filter="type"]': 'onFilterTypeChange',
            'change [data-filter="omrade"]': 'onFilterOmraderChange',
            'keypress [name="search-term"]': 'onSearchTermFieldKeyPress'
        },

        initialize: function (options) {

            var user = new User();
            this.user = user;

            this.defaultFetchQuery = this.defaultFetchQuery || {'privat.opprettet_av.id': user.get('id')};
            var urlFetchQuery = this.getUrlFetchQuery();

            this.itemType = options.itemType;

            this.collection.on('reset', this.onItemsFetched, this);

            _.bindAll(this, 'paginate', 'doSearch', 'onFilterTypeChange', 'onFilterOmraderChange', 'clearFiltersAndSearch', 'onSearchTermFieldKeyPress', 'sortByChanged', 'showAllDescriptions', 'hideAllDescriptions');

            var provider = user.get('provider'),
                groups = user.get('grupper') || [],
                externalGroups = user.get('eksterne_grupper') || [],
                group;

            if (provider == 'DNT Connect' && groups.length) {
                this.groups = groups;
                this.collection.fetchQuery = urlFetchQuery || options.userDefaultRouteFetchQuery || this.defaultFetchQuery;

            } else if (provider == 'DNT Connect' && externalGroups.length) {
                this.collection.fetchQuery = urlFetchQuery || options.userDefaultRouteFetchQuery || this.defaultFetchQuery;

            } else if (provider == 'Innholdspartner') {
                group = user.get('gruppe');
                this.collection.fetchQuery = urlFetchQuery || (!!group) ? {gruppe: group} : {};

            } else {
                this.collection.fetchQuery = urlFetchQuery || {'privat.opprettet_av.id': user.get('id')};
            }

            this.fetchItems();
            this.render();
        },

        showAllDescriptions: function (e) {
            this.$('table').addClass('description-visible');
            this.$('table').removeClass('description-hidden');
            this.$('table tr td.route-title').addClass('description-visible');
            this.$('table tr td.route-title').removeClass('description-hidden');
        },

        hideAllDescriptions: function (e) {
            this.$('table').addClass('description-hidden');
            this.$('table').removeClass('description-visible');
            this.$('table tr td.route-title').removeClass('description-visible');
            this.$('table tr td.route-title').addClass('description-hidden');
        },

        sortByChanged: function () {
            if (/endret/.test(this.collection.fetchQuery.sort)) {
                this.collection.setSort('navn');
            } else {
                this.collection.setSort('-endret');
            }

            this.fetchItems();
        },

        onSearchTermFieldKeyPress: function (e) {
            var code = e.keyCode || e.which;
            if (code === 13) {
                this.doSearch();
            }
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

            this.collection.fetchQuery.sort = this.collection.fetchQuery.sort || '-endret';

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
            this.collection.fetchQuery.skip = (page - 1) * this.collection.state.pageSize;
            this.fetchItems();
        },

        doSearch: function () {
            var term = this.$el.find('[name="search-term"]').val();
            delete this.collection.fetchQuery.skip;
            this.collection.setFilterNavn(term);
        },

        clearSearch: function () {
            this.$el.find('[name="search-term"]').val('');
        },

        getUrlFetchQuery: function () {
            var fetchQuery = {};
            var queryParamsString = window.location.search.substring(1);
            if (queryParamsString) {
                var queryParamsArray = queryParamsString.split('&');
                for (var i = 0; i < queryParamsArray.length; i++) {
                    var param = queryParamsArray[i].split('=');
                    fetchQuery[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
                }
                return fetchQuery;
            }
            return null;
        },

        showLoading: function () {
            this.$('[data-container-for="loading-items-message"]').removeClass('hidden');
            this.$('[data-container-for="no-items-alert"]').addClass('hidden');
            this.$('[data-container-for="no-items-matching-filter-alert"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').addClass('hidden');
            this.$('[data-container-for="paginator"]').addClass('hidden');
        },

        showRoutes: function () {
            this.$('[data-container-for="no-items-alert"]').addClass('hidden');
            this.$('[data-container-for="no-items-matching-filter-alert"]').addClass('hidden');
            this.$('[data-container-for="loading-items-message"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').removeClass('hidden');
            this.$('[data-container-for="paginator"]').removeClass('hidden');

        },

        showNoRoutes: function () {
            this.$('[data-container-for="loading-items-message"]').addClass('hidden');
            this.$('[data-container-for="items-table"]').addClass('hidden');

            if (this.collection.hasFiltersApplied()) {
                this.$('[data-container-for="no-items-alert"]').removeClass('hidden');
                this.$('[data-container-for="no-items-matching-filter-alert"]').addClass('hidden');

            } else {
                this.$('[data-container-for="no-items-alert"]').removeClass('hidden');
                this.$('[data-container-for="no-items-matching-filter-alert"]').addClass('hidden');
            }

            this.$('[data-container-for="no-items-alert"]').removeClass('hidden');
            this.$('[data-container-for="no-items-matching-filter-alert"]').addClass('hidden');
            this.$('[data-container-for="no-items-alert"]').addClass('hidden');
            this.$('[data-container-for="no-items-matching-filter-alert"]').removeClass('hidden');
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

        renderSortable: function () {
            var sort = this.collection.fetchQuery.sort;
            var direction = 'asc';
            var sortProperty = sort;

            if (sort[0] === '-') {
                direction = 'desc';
                sortProperty = sort.slice(1);
            }

            if (/endret/.test(sortProperty)) {
                this.$el.find('[data-sortable-name="endret"] [data-action="sortable-toggle"]').text('Fjern sortering');
            } else {
                this.$el.find('[data-sortable-name="endret"] [data-action="sortable-toggle"]').text('Sorter synkende');
            }
        },

        render: function () {
            this.renderSortable();

            var userGroups = this.user.get('grupper');
            var userExternalGroups = this.user.get('eksterne_grupper');

            if (this.collection.fetchQuery['rute.type']) {
                this.$('table').attr('data-contains-routes', true);
            } else {
                this.$('table').removeAttr('data-contains-routes');
            }

            if (this.user.get('provider') === 'DNT Connect') {

                if (this.user.get('er_dnt_gruppe_medlem') === true) {
                    this.$('.filters-and-search .filters').removeClass('hidden');
                }

                if (this.user.get('er_ekstern_gruppe_medlem') === true) {
                    this.$('.filters-and-search .filters').removeClass('hidden');
                }

                if ((userGroups && userGroups.length > 0) || (userExternalGroups && userExternalGroups.length > 0)) {
                    this.$('.group-select-container').removeClass('hidden');
                    var groupSelect = new SelectView({
                        model: this.model,
                        selectOptions: {
                            user: this.user,
                            groups: this.groups,
                            admin: this.user.get('er_admin'),
                            itemType: this.itemType,
                            externalGroups: state.externalGroups,
                            userExternalGroups: this.user.get('eksterne_grupper') || []
                        },
                        selectValue: this.collection.fetchQuery['gruppe'] || this.collection.fetchQuery['privat.opprettet_av.id'] || 'alle'
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
        },

        clearFiltersAndSearch: function () {
            this.collection.clearFilters();
        }

    });

});
