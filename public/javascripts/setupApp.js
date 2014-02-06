/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    Backbone.View.prototype.event_aggregator = _.extend({}, Backbone.Events);

    ns.initRouteApp = function () {
        var model = new DNT.App();
        model.set({route: new DNT.Route(), poiCollection: new DNT.PoiCollection(), pictureCollection: new DNT.PictureCollection()});
        var routeView = new DNT.RouteView({model: model}).render();
    };
}(DNT));