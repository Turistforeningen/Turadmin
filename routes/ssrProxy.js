/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    var restler = require('restler');
    var url = options.url || "https://ws.geonorge.no/SKWS3Index/ssr/sok?";

    app.all('/ssrProxy/*', function (req, res) {
        var path = req.url;
        url = "";

        var onComplete = function (data) {
            console.log(data);
            res.json(data);
        };

        var method = req.method;

        if (method === "GET") {
            console.log("get", path);
            //restler.get(url, {})
                //.on('complete', onComplete);
        }
    });
};

