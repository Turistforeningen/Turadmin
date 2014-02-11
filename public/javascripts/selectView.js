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
        },

        onSelect: function () {
            console.log("select");
        },

        render: function () {


            var html = this.template(this.selectOptions);
            $(this.el).html(html);

            return this;
        }
    });
}(DNT));
