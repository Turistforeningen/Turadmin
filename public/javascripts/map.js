/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */
$(window).load(function () {
    "use strict";
    var MapView = Backbone.View.extend({
        template: _.template($('#map-template').html()),
        topo:  L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', {
            maxZoom: 16,
            attribution: '<a href="http://www.statkart.no/">Statens kartverk</a>'
        }),
        render: function () {
            this.$el.html(this.template());
            var map = L.map(this.$('#map')[0], {layers: [this.topo]}).setView([61.5, 9], 13);
            return this;
        }
    });
    var mapView = new MapView();
    $('#mapContainer').html(mapView.render().el);
});