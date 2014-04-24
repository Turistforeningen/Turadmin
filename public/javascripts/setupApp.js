/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    Backbone.View.prototype.event_aggregator = _.extend({}, Backbone.Events);

    ns.initRouteApp = function (options) {

        options = options || {};

        var model = new DNT.App();
        var routeData = !!options.routeData ? options.routeData : {};
        var route = new DNT.Route(routeData);
        var user = new DNT.User();

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
