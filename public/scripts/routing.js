/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

(function () {
    "use strict";

    var _map;
    var routing;
    var enableSnapping = true;
    var maxDistanceToSnapLine = 100;

    var snappingRouter = function (l1, l2, cb) {
        var apiUri = '//n50.dnt.no/api/v1/routing/?coords=';
        var routeUri = apiUri + [l1.lng, l1.lat, l2.lng, l2.lat].join(',');

        var req = $.getJSON(routeUri);
        req.always(function (data, status) {
            if (status === 'success' && data && data.geometries && data.geometries.length && data.geometries[0].coordinates) {
                L.GeoJSON.geometryToLayer(data).eachLayer(function (layer) {
                    return cb(null, layer);
                });

                //cb(new Error('foo'));
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

    var Routing = function (map, snappingLayer) {

        _map = map;
        var sUrl = '//n50.dnt.no/api/v1/snapping/?coords=';
        // Listen to map:moveend event to get updated snappingLayer data
        /* map.on('moveend', $.proxy(function(e) {
            if (enableSnapping) {
                var url;
                url = sUrl + map.getBounds().toBBoxString();
                $.getJSON(url).always(function(data, status) {
                    if (status === 'success') {
                        if (data.geometries && data.geometries.length > 0) {
                            snappingLayer.clearLayers();
                            snappingLayer.addData(data);
                        }
                    } else {
                        Raven.captureMessage('Could not load snappingLayer data');
                    }
                });
            } else {
                snappingLayer.clearLayers();
            }
        }), this);*/

        // Trigger first map:moveend event to get initial snappingLayer data
        // map.fire('moveend');

        this.addRouting = function () {
            this.routing = new L.Routing({
                position: 'topleft',
                routing: {
                    router: myRouter
                },
                tooltips: {
                    waypoint: 'Rutepunkt. Klikk for å slette, dra for å flytte.',
                    segment: 'Dra for å opprette nytt rutepunkt.'
                },
                snapping: {
                    layers: [snappingLayer],
                    sensitivity: 15,
                    vertexonly: false
                },
                icons: {
                    draw: false
                }
            });

            map.addControl(this.routing);

        };

        this.enable = function (enable) {
            this.routing.draw(enable);
        };

        this.enableSnapping = function (enable) {
            enableSnapping = enable;
            if (enable) {
                // Trigger map:moveend event to get snappingLayer data
                map.fire('moveend');

            } else {
                snappingLayer.clearLayers();
            }
        };

        this.getGeoJson = function () {
            return this.routing.toGeoJSON(true);
        };

        this.loadGeoJson = function (geoJson, options, callback) {
            this.routing.loadGeoJSON(geoJson, options, callback);
        };
    };

    // Expose Routing as an Asynchronous Module
    if (typeof define !== 'undefined') {
        define('routing', [], function () {
            return Routing;
        });
    }

})();
