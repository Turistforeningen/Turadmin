
/*
 * GET home page.
 */


module.exports = function (app, options) {
    "use strict";

    /*
        GET list of routes (index page)
     */
    var getIndex = function (req, res) {
        res.render('index', { title: 'Mine turer' });
    };

    app.get('/', getIndex);
    app.get('/index', getIndex);

};



