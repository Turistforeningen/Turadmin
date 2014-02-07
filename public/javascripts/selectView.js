var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.SelectView = Backbone.View.extend({

        tagName: 'select',

        className: "form-control",

        template: _.template($('#selectOptionsTemplate').html()),

        events : {
            'change' : 'onSelect'
        },

        initialize : function () {

            _.bindAll(this, 'render', 'afterRender');
            var _this = this;
            this.render = _.wrap(this.render, function(render) {
                render();
                _this.afterRender();
                return _this;
            });

        },

        onSelect: function(){
            console.log("select");
        },

        render: function () {

            var model = {
                selectData: [
                    {
                        value: 'Barn',
                        label: 'Barn'
                    },
                    {
                        value: 'Ungdom',
                        label: 'Ungdom'
                    },
                    {
                        value: 'Fjellsportinteresserte',
                        label: 'Fjellsportinteresserte'
                    },
                    {
                        value: 'Seniorer',
                        label: 'Seniorer'
                    },
                    {
                        value: 'Rullestolbrukere',
                        label: 'Rullestolbrukere'
                    }
                ]
            };

            var html = this.template(model);
            $(this.el).html(html);

            // this.stickit(this.model, poiViewBindings);
            // debugger;
            // this.$el.select2();

            return this;
        },

        afterRender: function() {
            console.log('afterRender');
            // debugger;
            // this.$el.select2();
        }

    });
}(DNT));
