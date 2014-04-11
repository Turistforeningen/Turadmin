var DNT = window.DNT || {};
(function (ns) {
    "use strict";

    ns.SelectView = Backbone.View.extend({

        tagName: 'select',
        className: 'form-control',
        template: _.template($('#selectOptionsTemplate').html()),
        // attributes: { 'data-multiselect': 'true', 'multiple' : 'true'},

        events: {
            'change': 'onSelect'
        },

        initialize: function (options) {
            this.selectOptions = options.selectOptions;
            this.selectValue = options.selectValue;
        },

        onSelect: function () {
            console.log('select');
        },

        setValue: function (value) {

            value = value || this.selectValue;
            var $select = this.$el;

            if (!!value) {
                $select.prop('value', this.selectValue);
            }

        },

        render: function () {
            var html = this.template({ selectOptions:this.selectOptions});
            $(this.el).html(html);

            this.setValue();

            return this;
        }
    });
}(DNT));
