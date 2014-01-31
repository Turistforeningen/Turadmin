/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

module.exports = function (app, options) {
    "use strict";

    var ntbApiUri = options.ntbApiUri;
    var ntbApiKey = options.ntbApiKey;
    var restler = require('restler');
    var util = require('util');

    app.all('/apiProxy/poi/*', function (req, res) {
        var path = req.url;
        path = path.replace("apiProxy/poi/", "");
        var apiKey = "?api_key=" + ntbApiKey;
        var url = ntbApiUri + path + apiKey;
        console.log("url " + url);

        var onComplete = function (data) {
            console.log(data);
            if (data.document !== undefined) {
                data.document = undefined;
            }
            res.json(data);
        };

        var onCompletePost = function (data) {
            console.log("Response: ", data);
            if (data.document && data.document._id) {
                data._id = data.document._id;
            } else {
                console.error("id is missing in result after post!");
            }
            data.document = undefined;
            res.json(data);
        };

        var method = req.method;

        if (method === "GET") {
            console.log("getUrl = " + url);
            restler.get(url, {})
                .on('complete', onComplete);

        } else if (method === "POST") {
            console.log("Posting: " + util.inspect(req.body));
            restler.postJson(url, req.body)
                .on('complete', onCompletePost);

        } else if (method === "PUT") {
            var json = JSON.stringify(req.body);
            console.log("putUrl = " + url);
            var options = {data: json, headers: {}};
            options.headers['content-type'] = 'application/json';
            restler.put(url, options)
                .on('complete', onComplete);

        } else if (method === "DELETE") {
            console.log("Deleting: " + url);
            restler.del(url, {})
                .on('complete', onComplete);
        }
    });
};

