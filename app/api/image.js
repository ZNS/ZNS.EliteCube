var fs = require('fs');
var path = require('path');
var async = require('async');
var sqlite3 = require('sqlite3');
var imgur = require('imgur');

module.exports = function (app, config) {
    app.get('/api/images', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        var sql = "SELECT * FROM tblLogImage ORDER BY DateStamp DESC";
        var sqlCount = sql.replace('SELECT *', 'SELECT COUNT(*) as c');

        if (req.query.pageSize) {
            sql += " LIMIT " + req.query.pageSize;
            if (req.query.page) {
                sql += " OFFSET " + (req.query.page * req.query.pageSize);
            }
        }

        db.serialize(function () {
            var count = 0;
            db.get(sqlCount, function (err, rows) {
                if (!err && rows)
                    count = rows.c;
            });
            db.all(sql, function (err, rows) {
                res.send({ count: count, result: rows || [] });
            });
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

    app.post('/api/image/:imageId/imgur', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        imgur.setClientId(config.imgur_clientid);

        async.waterfall([
            function(callback) {
                db.get('SELECT * FROM tblLogImage WHERE LogImageId = ?', req.params.imageId, function (err, row) {
                    callback(err, row);
                });
            },
            function (row, callback) {
                if (row) {
                    var imgPath = path.join('.', 'data', row.ImagePath);
                    imgur.uploadFile(imgPath).then(function (json) {
                        callback(null, json.data, row)
                    }, function () {
                        callback({ error: 'failed to upload' });
                    });
                }
            },
            function (imgur, row, callback) {
                if (row && imgur) {
                    var link = 'http://imgur.com/' + imgur.id;
                    db.run('UPDATE tblLogImage SET ImgurLink = ?, ImgurDeleteHash = ? WHERE LogImageId = ?', link, imgur.deletehash, row.LogImageId, function (err) {
                        callback(err);
                    });
                    res.send(imgur);
                }
                else {
                    res.send({ error: 'failed' });
                }
            }
        ], function() {
            db.close();
        });
    });

    app.delete('/api/image/:id', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        
        async.waterfall([
            function (callback) {
                db.get("SELECT * FROM tblLogImage WHERE LogImageId = ?", req.params.id, function (err, row) {
                    callback(err, row);
                });
            },
            function (row, callback) {
                //Delete from disk
                try
                {
                    var imgPath = path.join('.', 'data', row.ImagePath);
                    var imgThumbPath = path.join('.', 'data', row.ImagePath.replace('.png', '_thumb.png'));
                    fs.unlinkSync(imgPath);
                    fs.unlinkSync(imgThumbPath);
                }
                catch (x) {
                    console.log(x);
                }

                //Delete from imgur
                if (row.ImgurDeleteHash && row.ImgurDeleteHash !== null && req.query.deleteImgur == 1) {
                    imgur.deleteImage(row.ImgurDeleteHash);
                }

                //Delete from db
                db.run("DELETE FROM tblLogImage WHERE LogImageId = ?", req.params.id, function (err) {
                    callback(err);
                });
            }
        ], function () {
            db.close();
            res.send({ status: 'ok' });
        });
    });

    app.delete('/api/image/:id/imgur', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        async.waterfall([
            function (callback) {
                db.get("SELECT * FROM tblLogImage WHERE LogImageId = ?", req.params.id, function (err, row) {
                    callback(err, row);
                });
            },
            function (row, callback) {
                //Delete from imgur
                if (row.ImgurDeleteHash && row.ImgurDeleteHash !== null) {
                    imgur.deleteImage(row.ImgurDeleteHash);
                }
                db.run("UPDATE tblLogImage SET ImgurLink = NULL, ImgurDeleteHash = NULL WHERE LogImageId = ?", req.params.id, function (err) {
                    callback(null);
                });
            }
        ], function () {
            db.close();
            res.send({ status: 'ok' });
        });
    });
};