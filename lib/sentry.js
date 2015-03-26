var Client = require('raven').Client;

module.exports = new Client(process.env.SENTRY_DNS);
module.exports.raven = require('raven');

if (process.env.NODE_ENV !== 'development') {
    module.exports.patchGlobal(function(id, err) {
        console.error('Uncaught Exception');
        console.error(err.message);
        console.error(err.stack);
        process.exit(1);
    });
}

