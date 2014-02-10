var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.SelectView = Backbone.View.extend({

        tagName: 'select',

        className: "form-control",

        template: _.template($('#selectOptionsTemplate').html()),

        attributes: { 'data-multiselect': 'true', 'multiple' : 'true'},

        events : {
            'change' : 'onSelect'
        },

        initialize : function (options) {
            this.selectOptions = options.selectOptions;

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


            var html = this.template(this.selectOptions);
            $(this.el).html(html);

            return this;
        },

        afterRender: function() {
            console.log('afterRender');
            // debugger;
            // this.$el.select2();
        }

    });
}(DNT));
