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

    var routeFactsBindings = {
        '[name = "route-facts-field-navn"]' : "navn",
        '[name = "route-facts-field-beskrivelse"]' : "beskrivelse",
        '[name = "route-facts-field-adkomst_generell"]': "adkomst",
        '[name = "route-facts-field-adkomst_kollektivtransport"]': "kollektiv",
        '[name = "route-facts-field-typetur"]': "kategori",
        '[name = "route-facts-field-gradering"]': "gradering",
        '[name = "route-facts-field-lenker"]': "linkText",
        '.form-control.route-facts-field-tidsbruk-normal-dager': "tidsbrukDager",
        '.form-control.route-facts-field-tidsbruk-normal-timer': "tidsbrukTimer",
        '.form-control.route-facts-field-tidsbruk-normal-minutter': "tidsbrukMinutter"
    };

    ns.RouteFactsView = Backbone.View.extend({

        el: "#route-facts",

        events: {
            "click #checkbox_kollektivMulig" : "toggleKollektivFieldVisibility",
            "click #route-facts-field-sesong-select-all" : "selectAllSeasons",
            "click #route-facts-field-sesong-deselect-all" : "deselectAllSeasons",
            "click .route-facts-field-sesong input[type='checkbox']" : "updateSeasonSelection"
        },

        initialize : function () {
            _.bindAll(this, "toggleHoursAndMinutesVisiblity", "addNameToHeader");
            this.model.on("change:tidsbrukDager", this.toggleHoursAndMinutesVisiblity);
            this.model.on("change:navn", this.addNameToHeader);
            if (!!this.model.get("navn") && this.model.get("navn").length > 0) {
                this.addNameToHeader();
            }
            if (!!this.model.get("tidsbrukDager")) {
                this.toggleHoursAndMinutesVisiblity();
            }
        },

        toggleHoursAndMinutesVisiblity: function () {
            var val = this.model.get("tidsbrukDager");
            console.log("val:", val);
            if (val === "1") {
                this.$(".form-group.route-facts-field-tidsbruk-normal-timer-minutter").removeClass("hidden");
            } else {
                this.$(".form-group.route-facts-field-tidsbruk-normal-timer-minutter").addClass("hidden");
            }
        },

        toggleKollektivFieldVisibility: function (event) {
            if (event.currentTarget.checked) {
                this.$("#route-facts-field-adkomst_kollektivtransport").removeClass("hidden");
                this.$("#route-facts-field-adkomst_kollektivtransport_description").removeClass("hidden");
            } else {
                this.$("#route-facts-field-adkomst_kollektivtransport").addClass("hidden");
                this.$("#route-facts-field-adkomst_kollektivtransport").val("");
                this.$("#route-facts-field-adkomst_kollektivtransport_description").addClass("hidden");
            }
        },

        selectAllSeasons : function () {
            this.$('.route-facts-field-sesong input[type="checkbox"]').prop('checked', true);
            this.$('#route-facts-field-sesong-deselect-all').removeClass('hidden');
            this.$('#route-facts-field-sesong-select-all').addClass('hidden');
        },

        deselectAllSeasons : function () {
            this.$('.route-facts-field-sesong input[type="checkbox"]').prop('checked', false);
            this.$('#route-facts-field-sesong-deselect-all').addClass('hidden');
            this.$('#route-facts-field-sesong-select-all').removeClass('hidden');
        },

        updateSeasonSelection : function () {
            var checked = this.$('.route-facts-field-sesong input[type="checkbox"]:checked');
            var seasons = [];
            for (var i = 0; i < checked.length; i =  i + 1) {
                var val = this.$(checked[i]).val();
                seasons.push(val);
            }
            this.model.set("sesong", seasons);
        },

        addNameToHeader: function () {
            $("#headerRouteName").html(this.model.get("navn"));
        },

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

            this.stickit(this.model, routeFactsBindings);

        }
    });
}(DNT));
