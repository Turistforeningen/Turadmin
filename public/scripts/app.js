/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var event_aggregator = _.extend({}, Backbone.Events);
    Backbone.View.prototype.event_aggregator = event_aggregator;
    Backbone.Model.prototype.event_aggregator = event_aggregator;
    Backbone.Collection.prototype.event_aggregator = event_aggregator;

    Backbone.Validation.configure({
        // Since we are automatically updating the model, we want the model
        // to also hold invalid values, otherwise, we might be validating
        // something else than the user has entered in the form.
        // See: http://thedersen.com/projects/backbone-validation/#configuration/force-update
        forceUpdate: true,

        // This configures what selector that will be used to look up a form element in the view.
        // By default it uses name, but if you need to look up elements by class name or id
        // instead, there are two ways to configure this.
        selector: 'data-model-validation-field-name'
    });

    // _.extend(Backbone.Validation.validators, {
    //     arrayMinLength: function(value, attr, customValue, model) {
    //         var array = !model.get(attr);
    //         if ((!array && typeof array !== 'object') || (array.length < customValue)) {
    //             return 'error';
    //         }
    //     }
    // });

    // Extend the callbacks to work with Bootstrap, as used in this example
    // See: http://thedersen.com/projects/backbone-validation/#configuration/callbacks
    _.extend(Backbone.Validation.callbacks, {

        valid: function (view, attr, selector) {
            var $el = $('[data-model-validation-field-name="' + attr + '"]'),
                $formGroup = $el.closest('.form-group'),
                $errorMsg = $el.next('.error-msg');

            $formGroup.removeClass('has-error');

            if ($errorMsg.length) {
                $errorMsg.html('').addClass('hidden');
            }
        },

        invalid: function (view, attr, error, selector) {
            var $el = $('[data-model-validation-field-name="' + attr + '"]'),
                $formGroup = $el.closest('.form-group'),
                $errorMsg = $el.next('.error-msg');

            $formGroup.addClass('has-error');

            if ($errorMsg.length) {
                $errorMsg.html(error).removeClass('hidden');
            } else {
                $el.after('<span class="help-block error-msg">' + error + '</span>');
            }
        }
    });


    ns.initNtbApp = function (options) {

        var routeView = new DNT.RouteView(options);
        routeView.render();

    };

}(DNT));
