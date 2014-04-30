var DNT = window.DNT || {};
(function (ns) {
    "use strict";

    ns.SelectView = Backbone.View.extend({

        tagName: 'select',
        className: 'form-control',
        template: _.template($('#selectOptionsTemplate').html()),

        events: {
            'change': 'onSelect'
        },

        initialize: function (options) {
            this.selectOptions = options.selectOptions;
            this.selectValue = options.selectValue;
        },

        onSelect: function () {},

        setValue: function (value) {

            value = value || this.selectValue;

            if (!!value) {
                this.$el.prop('value', this.selectValue);
            }

        },

        render: function () {
            var html = this.template({selectOptions: this.selectOptions});
            $(this.el).html(html);

            this.setValue();

            return this;
        }
    });
}(DNT));
