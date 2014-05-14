var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var turtyper = {
        'Fottur': ['Alpint', 'Bærtur', 'Fisketur', 'Fjelltur', 'Grottetur', 'Hyttetur', 'Skogstur', 'Sopptur', 'Telttur', 'Topptur', 'Trilletur'],
        'Skitur': ['Alpint', 'Hyttetur', 'Langrenn', 'Snowboard', 'Snøhuletur', 'Telemark', 'Telttur', 'Topptur'],
        'Sykkeltur': ['Downhillsykling', 'Landeveissykling', 'Terrengsykling'],
        'Padletur': ['Kajakktur', 'Kanotur'],
        'Bretur': ['Alpint', 'Hyttetur', 'Telttur', 'Topptur'],
        'Klatretur': ['Alpint', 'Telttur', 'Topptur']
    };

    var passerForOptions = ['Barn', 'Voksen', 'Senior'];

    var tilrettelagtForOptions = ['Barnevogn', 'Rullestol', 'Handikap'];

    ns.RouteFactsView = Backbone.View.extend({

        el: "#route-facts",

        bindings: {
            '[name="route-facts-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-facts-field-beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-facts-field-adkomst_generell"]': 'adkomst',
            '[name="route-facts-field-adkomst_kollektivtransport"]': 'kollektiv',
            '[name="route-facts-field-typetur"]': {
                observe: 'turtype',
                setOptions: {
                    validate: true
                }
            },
            '[name="route-facts-field-gradering"]': {
                observe: 'gradering',
                setOptions: {
                    validate: true
                }
            },
            'select.form-control.route-facts-field-tidsbruk-normal-dager': 'tidsbrukDager',
            'select.form-control.route-facts-field-tidsbruk-normal-timer': 'tidsbrukTimer',
            'select.form-control.route-facts-field-tidsbruk-normal-minutter': 'tidsbrukMinutter',
            '.route-facts-field-sesong input': {
                observe: 'sesong',
                setOptions: {
                    validate: true
                }
            }
        },

        events: {
            'click #checkbox_kollektivMulig': 'toggleKollektivFieldVisibility',
            'click #route-facts-field-sesong-select-all': 'selectAllSeasons',
            'click #route-facts-field-sesong-deselect-all': 'deselectAllSeasons',
            'click .route-facts-field-sesong input[type="checkbox"]': 'updateSeasonSelection',
            'click .route-facts-field-tags-primary label': 'setPrimaryTag'
        },

        initialize: function (options) {

            this.model.on('change:navn', this.addNameToHeader);
            this.model.on('change:tidsbrukDager', this.toggleHoursAndMinutesVisiblity);
            this.model.on('change:turtype', this.updateFlereTurtyperOptions);

            // Bind these methods to this scope
            _.bindAll(this, 'addNameToHeader', 'toggleHoursAndMinutesVisiblity', 'updateFlereTurtyperOptions');

            this.user = options.user;

            if (!!this.model.get('navn') && this.model.get('navn').length > 0) {
                this.addNameToHeader();
            }

            if (!!this.model.get('tidsbrukDager')) {
                this.toggleHoursAndMinutesVisiblity();
            }

            if (this.model.getRouteType() !== '') {
                var $routeTypeElement = this.$('input[value="' + this.model.getRouteType() + '"]');
                $routeTypeElement.parent('label').addClass('active');
            }

            if (!!this.model.get('gradering')) {
                var $graderingElement = this.$('input[value="' + this.model.get('gradering') + '"]');
                $graderingElement.parent('label').addClass('active');
            }

        },

        updateFlereTurtyperOptions: function () {

            var $flereTurtyperInput = this.$('[name="route-facts-field-flere-typer"]');

            if ($flereTurtyperInput.hasClass('select2-offscreen')) {
                $flereTurtyperInput.select2('val', '');
                $flereTurtyperInput.select2('destroy');
            }

            var turtype = this.model.get('turtype');

            $flereTurtyperInput.select2({
                tags: (!!turtype && turtype !== '') ? turtyper[turtype] : [], // If turtype is not set, no tags are available
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereTurtyperChange, this));

        },

        onFlereTurtyperChange: function (e) {
            var flereTurtyper = e.val;
            this.model.set('flereTurtyper', flereTurtyper);
        },

        toggleHoursAndMinutesVisiblity: function () {
            var val = this.model.get('tidsbrukDager');
            if (val === '1') {
                this.$('.form-group.route-facts-field-tidsbruk-normal-timer-minutter').removeClass('hidden');
            } else {
                this.$('.form-group.route-facts-field-tidsbruk-normal-timer-minutter').addClass('hidden');
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

        selectAllSeasons: function () {
            this.$('.route-facts-field-sesong input[type="checkbox"]').prop('checked', true);
            this.$('#route-facts-field-sesong-deselect-all').removeClass('hidden');
            this.$('#route-facts-field-sesong-select-all').addClass('hidden');
        },

        deselectAllSeasons: function () {
            this.$('.route-facts-field-sesong input[type="checkbox"]').prop('checked', false);
            this.$('#route-facts-field-sesong-deselect-all').addClass('hidden');
            this.$('#route-facts-field-sesong-select-all').removeClass('hidden');
        },

        updateSeasonSelection: function () {
            var checked = this.$('.route-facts-field-sesong input[type="checkbox"]:checked');
            var seasons = [];
            for (var i = 0; i < checked.length; i =  i + 1) {
                var val = this.$(checked[i]).val();
                seasons.push(val);
            }
            this.model.set('sesong', seasons);
        },

        addNameToHeader: function () {
            $('[data-placeholder-for="route-name"]').html(this.model.get("navn"));
        },

        render: function () {

            this.updateFlereTurtyperOptions();
            this.$('[name="route-facts-field-flere-typer"]').select2('val', this.model.getAdditionalRouteTypes());

            $('input[name="route-facts-field-passer_for"]').select2({
                tags: passerForOptions,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(function (e) {
                var passer_for = e.val;
                this.model.set('passer_for', passer_for);
            }, this));

            this.$('[name="route-facts-field-passer_for"]').select2('val', this.model.get('passer_for'));

            $('input[name="route-facts-field-tilrettelagt_for"]').select2({
                tags: tilrettelagtForOptions,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(function (e) {
                var tilrettelagt_for = e.val;
                this.model.set('tilrettelagt_for', tilrettelagt_for);
            }, this));

            this.$('[name="route-facts-field-tilrettelagt_for"]').select2('val', this.model.get('tilrettelagt_for'));

            var userGroups = this.user.get('grupper');
            if (userGroups.length > 0) {
                var select2Groups = [];

                for (var i = 0; i < userGroups.length; i++) {
                    select2Groups[i] = {};
                    select2Groups[i].id = userGroups[i].object_id;
                    select2Groups[i].text = userGroups[i].navn;
                }

                $('input[name="route-facts-field-grupper"]').select2({
                    tags: select2Groups,
                    createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
                }).on('change', $.proxy(function (e) {
                    var routeGroups = e.val;
                    this.model.set('grupper', routeGroups);
                }, this));

                this.$('[name="route-facts-field-grupper"]').select2('val', this.model.get('grupper'));

            } else {
                // If user does not belong to any groups, do not show groups field.
                this.$('.form-group.route-facts-field-grupper').remove();
            }

            var routeFactsLinksView = new DNT.RouteFactsLinksView({ model: this.model });
            this.$('#routeFactsLinksInput').append(routeFactsLinksView.render().el);

            var publicTransportation = this.model.get('kollektiv');

            if (!!publicTransportation && publicTransportation.length > 0) {
                this.$('.route-facts-field-adkomst_kollektivtransport input[type="checkbox"]').prop('checked', true);
                this.$('.route-facts-field-adkomst_kollektivtransport textarea').removeClass('hidden');
            }

            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
}(DNT));
