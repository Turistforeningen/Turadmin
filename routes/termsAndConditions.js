module.exports = function (app, options) {
    "use strict";

    /**
     * GET Terms and Conditions
     */
    var getTermsAndConditions = function (req, res) {
        var renderOptions = {title: 'Godkjenn villkår'};
        res.render('termsAndConditions', renderOptions);
    };

    /**
     * POST Terms and Conditions
     * A post request to this route means terms & conditions are accepted
     */
    var postTermsAndConditions = function (req, res) {
        res.cookie('termsAndConditionsAccepted', 'true', {signed: true, maxAge: 2628000000});
        res.redirect('/');
    };

    var areTermsAndConditionsAccepted = function (req, res, next) {
        var accepted = (!!req.signedCookies && (req.signedCookies.termsAndConditionsAccepted == 'true')) ? true : false;
        if (accepted) {
            next();
        } else {
            res.redirect('/brukervillkar');
        }
    };

    app.get('/', areTermsAndConditionsAccepted);
    app.get('/tur*', areTermsAndConditionsAccepted);
    app.get('/brukervillkar', getTermsAndConditions);
    app.post('/brukervillkar', postTermsAndConditions);

};
