var async = require('async');
var server = require('./server');
var db = require('./db');
var imageWatcher = require('./imageWatcher');
var config = require('../config');
var path = require('path');

config.runtime = {
    db_version: 1,
    db_path: path.join('.', 'data', 'db'),
    db_name: 'elitecube.db',
    db_conn: path.join('.', 'data', 'db', 'elitecube.db'),
    screenshots_destination: path.join('.', 'data', 'screenshots'),
    eddb_path: path.join('.', 'data', 'eddb')
};

async.series([
    function intializeDb(callback) {
        db(config ,callback);
    },
    function startServer(callback) {
        server(config, callback);
    },
    function initializeImageWatcher(callback) {
        imageWatcher(config, callback);
    }
]);