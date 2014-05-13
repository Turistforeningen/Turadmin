/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.RouteFactsLinkView = Backbone.View.extend({

        template: _.template($('#routeFactsLinkTemplate').html()),

        events: {
            'change input[name="link-title"]': 'setTitle',
            'change input[name="link-url"]': 'setUrl',
            'click [data-action="remove-link"]': 'removeLink'
        },

        initialize: function (options) {
            this.link = options.link;
        },

        render: function () {
            var html =  this.template({link: this.link});
            $(this.el).html(html);
            return this;
        },

        updateLink: function () {
            var links = this.model.get('lenker');
            var linkIndex = links.indexOf(this.link);
            links[linkIndex] = this.link;
            this.model.set('lenker', links);
        },

        setTitle: function (e) {
            var formField = e.currentTarget;
            var title = $(formField).val();
            this.link.tittel = title;
            this.updateLink();
        },

        setUrl: function (e) {
            var formField = e.currentTarget;
            var url = $(formField).val();
            this.link.url = url;
            this.updateLink();
        },

        removeLink: function (e) {
            var links = this.model.get('lenker');
            var linkIndex = links.indexOf(this.link);
            links.splice(linkIndex, 1);
            this.model.set('lenker', links);
            this.remove();
        }

    });

}(DNT));
