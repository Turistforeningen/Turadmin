/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";
    var routing;
    var enableSnapping = true;
    var maxDistanceToSnapLine = 100;

    var snappingRouter = function (l1, l2, cb) {
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

                        if (d1 < maxDistanceToSnapLine && d2 < maxDistanceToSnapLine) {
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

    var lineRouter = function (l1, l2, cb) {
        cb(null, new L.Polyline([l1, l2]));
    };

    var myRouter = function (l1, l2, cb) {
        if (enableSnapping) {
            return snappingRouter(l1, l2, cb);
        }
        return lineRouter(l1, l2, cb);
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

        this.enableSnapping = function (enable) {
            enableSnapping = enable;
        };
    };

}(DNT));

