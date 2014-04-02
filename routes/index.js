
/*
 * GET home page.
 */

module.exports = function (app, options) {
    "use strict";

    var connect = options.connect;

    /*
        GET list of routes (index page)
     */
    var getIndex = function (req, res) {
        // Todo: Add autentication
        req.session.userId = "testUserId";
        res.render('index', { title: 'Mine turer' });
    };

    var getConnect = function (req, res) {
      // Check for ?data= query
      if (req && req.query && req.query.data) {
        try {
          var data = client.decryptJSON(req.query.data);
        } catch (e) {
          // @TODO handle this error propperly
          var data = {er_autentisert: false}
        }

        if (data.er_autentisert === true) {
          // User is authenticated
        } else {
          // User is not authenticated
        }

      // Initiate DNT Connect signon
      } else {
        res.redirect(connect.signon('http://localhost:3004/connect'));
      }
    };

    app.get('/', getIndex);
    app.get('/index', getIndex);
    app.get('/connect', getConnect);

};

