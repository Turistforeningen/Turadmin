/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.SearchFieldView = Backbone.View.extend({


        el: "#placeSearchInput",

        events: {
            "keyup": "search",
            "change": "select"
        },

        initialize: function () {
            _.bindAll(this, "search", "render");
            this.$el.select2({
                minimumInputLength: 2,
                query: this.search,
                formatResult: this.format,
                escapeMarkup: function (m) { return m; }
            });
        },

        search: function (query) {
            var place = query.term;
            this.collection.search(place, this.render, query.callback);
        },

        select: function (selected) {
            console.log(selected.val);
        },

        render: function (select2AddResultsFunc) {
            if (!!select2AddResultsFunc && this.collection.length > 0 && _.isFunction(select2AddResultsFunc)) {

                var data = { results: [] };
                var id = 0;
                this.collection.each(function (place) {
                    data.results.push({id: id, place: place });
                    id = id + 1;
                });
                select2AddResultsFunc(data);
            }
        },

        format: function (obj) {
            var placeHtml = new ns.SearchResultView({model: obj.place}).render().el;
            return placeHtml;
        }
    });

    ns.SearchResultView = Backbone.View.extend({

        template: _.template($('#searchResultTemplate').html()),

        render: function () {
            var json = this.model.toJSON();
            var html =  this.template(json);
            $(this.el).html(html);
            return this;
        }

    });


}(DNT));
