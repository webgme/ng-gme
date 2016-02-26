/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 * @author kecso / https://github.com/kecso
 */

var config = require('webgme/config/config.default');

config.server.port = 8888;

config.mongo.uri = 'mongodb://127.0.0.1:27017/multi';

config.client.appDir = './';

config.mongo.uri = 'mongodb://127.0.0.1:27017/APPTEST';
//config.authentication.enable = true;

module.exports = config;
