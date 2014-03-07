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

		var turId = options.turId;

		var model = new DNT.App();
		var route = new DNT.Route();

		if(!!turId){
			route.set('_id', turId);
			route.fetch();
		}

		model.set({route: route, poiCollection: new DNT.PoiCollection(), pictureCollection: new DNT.PictureCollection()});
		var routeView = new DNT.RouteView({model: model}).render();
	};
}(DNT));
