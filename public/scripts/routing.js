/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

(function () {
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

    var Routing = function (map, snappingLayer) {

        var apiUri = $('body').data("apiuri");
        var sUrl = apiUri + '/bbox/?bbox=';

        // Listen to map:moveend event to get updated snappingLayer data
        map.on('moveend', $.proxy(function(e) {
            if (map.getZoom() > 12 && enableSnapping) {
                var url;
                url = sUrl + map.getBounds().toBBoxString() + '&callback=?';
                $.getJSON(url).always(function(data, status) {
                    if (status === 'success') {
                        data = JSON.parse(data);
                        if (data.geometries && data.geometries.length > 0) {
                            snappingLayer.clearLayers();
                            snappingLayer.addData(data);
                        }
                    } else {
                        console.error('Could not load snappingLayer data');
                    }
                });
            } else {
                snappingLayer.clearLayers();
            }
        }), this);

        // Trigger first map:moveend event to get initial snappingLayer data
        map.fire('moveend');

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
