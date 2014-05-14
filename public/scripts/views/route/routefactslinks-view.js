/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.RouteFactsLinksView = Backbone.View.extend({

        template: _.template($('#routeFactsLinksTemplate').html()),

        el: '#routeFactsLinksView',

        events: {
            'click [data-action="add-link"]': 'addLink'
        },

        initialize: function (options) {
            var linksArray = this.model.get('lenker');
            this.model.set('lenker', linksArray);
        },

        render: function () {
            var html =  this.template();
            $(this.el).html(html);

            var links = this.model.get('lenker');
            _.each(links, this.renderLink, this);
            return this;
        },

        renderLink: function (link, linkNumber, list) {
            var routeFactsLinkView = new DNT.RouteFactsLinkView({ model: this.model, link: link, linkNumber: linkNumber });
            this.$('#routeFactsLinksInput').append(routeFactsLinkView.render().el);
        },

        addLink: function (e) {
            var link = {
                tittel: '',
                url: 'http://'
            };

            var links = this.model.get('lenker');
            links.push(link);
            this.model.set('lenker', links);

            this.renderLink(link);
        }

    });

}(DNT));
