var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.RouteFactsView = Backbone.View.extend({

        el: "#route-facts",

        events : {
            // "sortstop #route-images-all-container": "picturePositionUpdated",
            // "updatePictureIndexes": "updateIndexes"
        },

        initialize : function () {
            // $('[data-multiselect="true"]').select2();
            console.log('init!');
        },

        render: function () {
            // $('[data-multiselect="true"]').select2();
            console.log('render!');

            var select = new DNT.SelectView();
            this.$('#passerForSelect').html(select.render().el);
            //debugger;
            //select.$el.select2();

        }
    });
}(DNT));
