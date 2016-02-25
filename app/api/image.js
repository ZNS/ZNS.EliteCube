var fs = require('fs');
var path = require('path');
var async = require('async');
var sqlite3 = require('sqlite3');

module.exports = function (app, config) {
    app.get('/api/images', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.all("SELECT * FROM tblLogImage ORDER BY DateStamp DESC", function (err, rows) {
            res.send(rows);
        });
        db.close();
    });

    app.get('/api/images/:systemId', function (req, res) {
        var imagePath = path.join(config.runtime.screenshots_destination, req.params.systemId);
        fs.stat(imagePath, function (err, stats) {
            if (err && err.code === 'ENOENT') {
                return res.send([]);
            }

            fs.readdir(imagePath, function (err, files) {
                if (files && files.length > 0) {
                    for (var i = 0; i < files.length; i++) {
                        files[i] = path.join(imagePath, files[i]);
                    }

                    //Get stats
                    var fileInfo = [];
                    async.each(files, function (file, callback) {
                        var fileName = path.basename(file);
                        fs.stat(file, function (err, stats) {
                            fileInfo.push({ path: '/screenshots/' + req.params.systemId + '/' + fileName, created: stats.birthtime.getTime() });
                            callback(err);
                        });
                    },
                    function (err) {
                        res.send(fileInfo);
                    });
                }
                else {
                    res.send([]);
                }
            });
        });
    });
};