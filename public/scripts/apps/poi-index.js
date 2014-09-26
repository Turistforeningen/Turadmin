// Start the main app logic.
requirejs(
    [
        'jquery',
        'underscore',
        'backbone',
        'state',
        'views/poi/index'
    ],
    function ($, _, Backbone, state, IndexView) {

        var event_aggregator = _.extend({}, Backbone.Events);
        Backbone.View.prototype.event_aggregator = event_aggregator;
        Backbone.Model.prototype.event_aggregator = event_aggregator;
        Backbone.Collection.prototype.event_aggregator = event_aggregator;

        console.log('App POI index init', state);

        var editorView = new IndexView(state);
    }
);
