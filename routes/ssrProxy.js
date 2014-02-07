/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    var restler = require('restler');
    var util = require('util');
    var url = options.url || "https://ws.geonorge.no/SKWS3Index/ssr/sok";

    app.all('/ssrProxy/*', function (req, res) {
        var place = req.param("search");

        var onComplete = function (data) {
            console.log(util.inspect(data));
            var result = data.sokRes.stedsnavn || [];
            console.log("ssr result is: ", util.inspect(result));
            res.json(result);
        };

        var method = req.method;

        if (method === "GET") {
            console.log("get", place);
            restler.get(url, {query: {"navn": place, "epsgKode": 4326}})
                .on('complete', onComplete);
        }
    });
};

