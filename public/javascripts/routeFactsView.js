var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var passerFor = {
        selectData: [
            {
                value: 'Barn',
                label: 'Barn'
            },
            {
                value: 'Voksen',
                label: 'Voksen'
            },
            {
                value: 'Senior',
                label: 'Senior'
            }
            // {
            //     value: 'Barn',
            //     label: 'Barn'
            // },
            // {
            //     value: 'Ungdom',
            //     label: 'Ungdom'
            // },
            // {
            //     value: 'Fjellsportinteresserte',
            //     label: 'Fjellsportinteresserte'
            // },
            // {
            //     value: 'Seniorer',
            //     label: 'Seniorer'
            // },
            // {
            //     value: 'Rullestolbrukere',
            //     label: 'Rullestolbrukere'
            // }
        ]
    };

    var tilrettelagtFor = {
        selectData: [
            {
                value: 'Barnevogn',
                label: 'Barnevogn'
            },
            {
                value: 'Rullestol',
                label: 'Rullestol'
            },
            {
                value: 'Handikap',
                label: 'Handikap'
            }
        ]
    };

    var grupper = {
        selectData: [
            {
                value: 1,
                label: 'Eier 1'
            },
            {
                value: 2,
                label: 'Eier 2'
            }
        ]
    };

    ns.RouteFactsView = Backbone.View.extend({

        el: "#route-facts",

        events : {
            // "sortstop #route-images-all-container": "picturePositionUpdated",
            // "updatePictureIndexes": "updateIndexes"
        },

        initialize : function () {},

        render: function () {

            var passerForSelect = new DNT.SelectView({ model: this.model, selectOptions: passerFor });
            this.$('#passerForSelect').html(passerForSelect.render().el);
            passerForSelect.$el.select2();

            var tilrettelagtForSelect = new DNT.SelectView({ model: this.model, selectOptions: tilrettelagtFor });
            this.$('#tilrettelagtForSelect').html(tilrettelagtForSelect.render().el);
            tilrettelagtForSelect.$el.select2();

            var grupperSelect = new DNT.SelectView({ model: this.model, selectOptions: grupper });
            this.$('#grupperSelect').html(grupperSelect.render().el);
            grupperSelect.$el.select2();

        }
    });
}(DNT));
