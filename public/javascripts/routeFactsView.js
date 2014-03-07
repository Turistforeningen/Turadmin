var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var flereTurTyper = {
        selectData: [
            {
                value: "Gåtur",
                label: "Gåtur"
            },
            {
                value: "Skitur",
                label: "Skitur"
            },
            {
                value: "Sykkeltur",
                label: "Sykkeltur"
            },
            {
                value: "Padletur",
                label: "Padletur"
            },
            {
                value: "Klatretur",
                label: "Klatretur"
            },
            {
                value: "Bretur",
                label: "Bretur"
            }
        ]
    };

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

        events : {},

        initialize : function () {},

        render: function () {

            var flereTurTyperSelect = new DNT.SelectView({ model: this.model, selectOptions: flereTurTyper });
            this.$('#flereTurtyperSelect').html(flereTurTyperSelect.render().el);
            flereTurTyperSelect.$el.select2();

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
