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

        events: {
            'click #nyTurButton': 'openNewRoutePage'
        },

        initialize : function (appData) {
            _.bindAll(this, 'render');
            $('#headerRouteName').addClass('hidden');
            this.collection = new DNT.RouteCollection();
            this.collection.on("reset", this.render);

            if (!!appData && appData.authType === 'dnt-connect' && !!appData.userGroups) {
                this.groups = appData.userGroups;
                this.fetchQuery = { 'gruppe': _.first(appData.userGroups).object_id };
                this.fetchRoutes();

            } else {
                var userId = appData.userData.sherpa_id;
                this.fetchQuery = { 'privat.opprettet_av.id': 'someId' };
                this.fetchRoutes();

            }

        },

        fetchRoutes: function () {
            this.collection.fetch({
                reset: true,
                data: this.fetchQuery
            });
        },

        openNewRoutePage : function () {
            // window.location = '/tur';
        },

        onGroupChange: function (e) {
            var groupId = e.target.value;
            this.fetchQuery = {'gruppe': groupId};
            this.fetchRoutes();

        },

        render: function () {
            var that = this;

            if (!!this.fetchQuery && !!this.fetchQuery.gruppe) {
                var groupSelect = new ns.SelectView({ model: this.model, selectOptions: this.groups, selectValue: this.fetchQuery.gruppe });
                this.$('#groupSelectPlaceholder').html(groupSelect.render().el).on('change', $.proxy(this.onGroupChange, this));
            }

            that.$el.find("#listItems").empty();

            this.collection.each(function (route) {
                var itemView = new ns.ListItemView({model: route});
                that.$el.find("#listItems").append(itemView.render().el);
            });

        }

    });

}(DNT));
