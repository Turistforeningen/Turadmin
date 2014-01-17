/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";
    var routing;
    var myRouter = function (l1, l2, cb) {
        var apiUri = $('body').data("apiuri");
        var restUri = apiUri + "/route/?coords=";
        var routeUri = restUri + [l1.lng, l1.lat, l2.lng, l2.lat].join(',') + '&callback=?';
        var req = $.getJSON(routeUri);
        req.always(function (data, status) {
            if (status === 'success') {
                try {
                    L.GeoJSON.geometryToLayer(JSON.parse(data)).eachLayer(function (layer) {
                        // 14026
                        var d1 = l1.distanceTo(layer._latlngs[0]);
                        var d2 = l2.distanceTo(layer._latlngs[layer._latlngs.length - 1]);

                        if (d1 < 100 && d2 < 100) {
                            return cb(null, layer);
                        }
                        return cb(new Error('This has been discarded'));
                    });
                } catch (e) {
                    return cb(new Error('Invalid JSON'));
                }
            } else {
                return cb(new Error('Routing failed'));
            }
        });
    };

    ns.Routing = function (map, snappingLayer) {
        this.addRouting = function () {
            routing = new L.Routing({
                position: 'topleft',
                routing: {
                    router: myRouter
                },
                snapping: {
                    layers: [snappingLayer],
                    sensitivity: 15,
                    vertexonly: false
                }
            });
            map.addControl(routing);
        };

        this.enable = function (enable) {
            routing.draw(enable);
        };
    };

}(DNT));

