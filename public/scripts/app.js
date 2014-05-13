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

    _.extend(Backbone.Validation.validators, {
        arrayMinLength: function(value, attr, customValue, model) {
            var array = !model.get(attr);
            if ((!array && typeof array !== 'object') || (array.length < customValue)) {
                return 'error';
            }
        }
    });

    // Extend the callbacks to work with Bootstrap, as used in this example
    // See: http://thedersen.com/projects/backbone-validation/#configuration/callbacks
    _.extend(Backbone.Validation.callbacks, {

        valid: function (view, attr, selector) {
            var $el = view.$('[data-model-validation-field-name=' + attr + ']'),
                $formGroup = $el.closest('.form-group'),
                $errorMsg = $el.next('.error-msg');

            $formGroup.removeClass('has-error');

            if ($errorMsg.length) {
                $errorMsg.html('').addClass('hidden');
            }
        },

        invalid: function (view, attr, error, selector) {
            var $el = view.$('[data-model-validation-field-name=' + attr + ']'),
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


    ns.initRouteApp = function (options) {

        options = options || {};

        var model = new DNT.App();
        var routeData = !!options.routeData ? options.routeData : {};
        var route = new DNT.Route(routeData);
        var user = new DNT.User({grupper: options.userGroups});

        // var turId = options.turId;

        // NOTE: Route data is now passed directly to app. No need to fetch.
        // if(!!turId){
        //     route.set('_id', turId);
        //     route.fetch();
        // }

        var pictureCollection = new DNT.PictureCollection();

        // Add all pictures passed to app to pictureCollection
        if (!!options.picturesData && options.picturesData.length > 0) {
            for (var i = 0; i < options.picturesData.length; i++) {
                var picture = new DNT.Picture(options.picturesData[i]);
                pictureCollection.add(picture);
            }
        }

        var poiCollection = new DNT.PoiCollection();

        if (!!options.poisData && options.poisData.length > 0) {
            for (var j = 0; j < options.poisData.length; j++) {
                var poi = new DNT.Poi(options.poisData[j]);
                poiCollection.add(poi);
            }
        }

        model.set({
            route: route,
            user: user,
            poiCollection: poiCollection,
            pictureCollection: pictureCollection
        });

        var routeView = new DNT.RouteView({model: model});
        routeView.render();

    };

}(DNT));
