var sqlite3 = require('sqlite3');
var fs = require("fs");
var jsonStream = require('JSONStream');
var es = es = require('event-stream');
var async = require('async');
var path = require('path');
var request = require('request');
var mv = require('mv');

sqlite3.toNamedParams = function (obj) {
    var param = {};
    for (var prp in obj) {
        param['$' + prp] = obj[prp];
    }
    return param;
};

module.exports = function (app, config) {
    app.get('/api/log', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        //Prepare query
        var param = {};
        var sql = "SELECT * FROM tblLog";
        
        if (req.query && req.query !== null && (req.query.SystemId || req.query.LogId)) {
            param = sqlite3.toNamedParams(req.query);
            sql += " WHERE ";
            if (req.query.SystemId) {
                sql += "SystemId = $SystemId AND ";
            }
            if (req.query.LogId) {
                sql += "LogId != $LogId AND ";
            }
            sql = sql.substr(0, sql.length - 5);
        }

        var sqlCount = sql.replace('SELECT *', 'SELECT COUNT(*) as c');

        sql = sql + " ORDER BY DateStamp DESC";

        if (req.query.pageSize) {
            sql += " LIMIT " + req.query.pageSize;            
            if (req.query.page) {
                sql += " OFFSET " + (req.query.page * req.query.pageSize);
                delete (param.$page);
            }
            delete (param.$pageSize);
        }

        db.serialize(function () {
            var count = 0;
            var images = [];
            db.get(sqlCount, param, function (err, rows) {
                if (!err && rows)
                    count = rows.c;
            });
            db.all(sql, param, function (err, rows) {
                res.send({ count: count, result: rows || [] });
            });
        });

        db.close();
    });

    app.get('/api/log/:id', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        db.serialize(function () {
            var images = [];
            db.all("SELECT * FROM tblLogImage WHERE LogId = ?", req.params.id, function (err, rows) {
                images = rows || [];
            });
            db.get("SELECT * FROM tblLog WHERE LogId = ?", req.params.id, function (err, row) {
                res.send({ log: row, images: images });
            });
        });

        db.close();
    });

    app.post('/api/log/:id/notes', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        db.run("UPDATE tblLog SET Notes = ? WHERE LogId = ?", req.body.notes, req.params.id);

        db.close();
    });

    app.post('/api/log', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        var add = true;

        var newLog = sqlite3.toNamedParams(req.body);
        if (!newLog.$DateStamp) {
            newLog.$DateStamp = new Date().getTime();
        }
        if (!newLog.$StationName) {
            newLog.$StationName = null;
        }

        async.waterfall([
            function (callback) {
                //Check if this record is same any of the  previous two. We check two because the api sometimes pass old data.
                db.all("SELECT SystemId, StationName FROM tblLog ORDER BY DateStamp DESC LIMIT 2", function (err, row) {
                    if (row && row !== null && row.length > 0) {
                        for (var i = 0; i < row.length; i++) {
                            if (row[i].SystemId === req.body.SystemId && row[i].StationName === req.body.StationName) {
                                return callback(err, false);
                            }
                        }
                    }
                    callback(err, true);
                });
            },
            function (run, callback) {
                //If we should not run, pass on to next function
                if (!run) {
                    return callback(null, run, null);
                }

                //Get system data
                var stream = fs.createReadStream(path.join(config.runtime.eddb_path, "systems.json"))
                .pipe(jsonStream.parse('*'))
                .pipe(es.through(
                    function (data) {
                        if (data && data != null && data.name === newLog.$SystemName) {
                            stream.destroy();
                            callback(null, run, data);
                        }
                    },
                    function end() {
                        callback(null, run, null);
                    }
                ));
            },
            function (run, systemData, callback)
            {
                //If we should not run, pass on to next function
                if (!run) {
                    return callback(null, run, null);
                }

                if (systemData === null || !systemData.x || !systemData.y || !systemData.z) {
                    //Try to get cooridinates from edsm
                    request('http://www.edsm.net/api-v1/system/', {
                        qs: {
                            sysname: newLog.$SystemName,
                            coords: 1
                        }
                    }, 
                    function (err, response, body) {
                        if (!err && body != '-1') {
                            var json = JSON.parse(body);
                            if (json && json.coords) {
                                if (systemData === null) {
                                    systemData = {};
                                }
                                systemData.x = json.coords.x;
                                systemData.y = json.coords.y;
                                systemData.z = json.coords.z;
                            }
                        }
                        callback(err, run, systemData);
                    });
                }
                else {
                    callback(null, run, systemData);
                }
            },
            function (run, systemData, callback) {
                if (!run) {
                    return callback(null, -1);
                }

                newLog.$Allegiance = null;
                newLog.$Government = null;
                newLog.$Faction = null;
                newLog.$Population = 0;
                newLog.$Economy = null;
                if (systemData !== null) {
                    newLog.$Allegiance = systemData.allegiance || null;
                    newLog.$Government = systemData.government || null;
                    newLog.$Faction = systemData.faction || null;
                    newLog.$Population = systemData.population || 0;
                    newLog.$Economy = systemData.primary_economy || null;
                    newLog.$CoordX = systemData.x || 0;
                    newLog.$CoordY = systemData.y || 0;
                    newLog.$CoordZ = systemData.z || 0;
                }

                //Persist to db
                db.run("INSERT INTO tblLog(DateStamp, SystemId, SystemName, Allegiance, Government, Faction, Population, Economy, CoordX, CoordY, CoordZ, StationName, Notes) VALUES($DateStamp, $SystemId, $SystemName, $Allegiance, $Government, $Faction, $Population, $Economy, $CoordX, $CoordY, $CoordZ, $StationName, $Notes)", newLog, function (err, row) {
                    callback(err, this.lastID);
                });
            },
            function(logId, callback)
            {
                //Get current journey
                if (logId === -1) {
                    return callback(null, -1, -1);
                }

                var journeyId = -1;
                db.get("SELECT JourneyId FROM tblJourney WHERE EndDate IS NULL LIMIT 1", function (err, row) {
                    if (row && row.JourneyId) {
                        journeyId = row.JourneyId;
                    }
                    callback(err, logId, journeyId);
                });
            },
            function(logId, journeyId, callback)
            {
                //Insert into journey
                if (logId !== -1 && journeyId !== -1) {
                    db.run("INSERT INTO tblJourneyLog(JourneyId, LogId) VALUES(?, ?)", journeyId, logId, function (err, row) {
                        callback(err);
                    });
                }
                else {
                    callback(null);
                }
            }
        ],
        function (err, result) {
            db.close();
            if (err)
                console.log("Add log", err);
            res.send({ status: err ? "error" : "ok", error: err || null });
        });
    });

    app.delete('/api/log/:id', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        async.series([
            function (callbackOuter) {
                if (req.query.moveImages && req.query.moveImages == 1) {
                    async.waterfall([
                        function (callback) {
                            //Get images
                            db.all("SELECT * FROM tblLogImage WHERE LogId = ?", req.params.id, function (err, rows) {
                                callback(err, rows || []);
                            });
                        },
                        function (images, callback) {
                            if (images.length == 0) {
                                callback(null, null, null);
                            }

                            //get destination
                            db.get("SELECT LogId, SystemId FROM tblLog WHERE LogId < ? ORDER BY LogId DESC LIMIT 1", req.params.id, function (err, row) {
                                console.log(err);
                                callback(err, images, row)
                            });
                        },
                        function (images, toLog, callback) {
                            if (!images || !toLog) {
                                callback(null, null);
                            }

                            //Move images
                            async.each(images, function (img, cb) {
                                var dir = path.parse(img.ImagePath).dir;
                                var fileName = path.parse(img.ImagePath).base;
                                mv(path.join('.', 'data', dir, fileName), path.join(config.runtime.screenshots_destination, toLog.SystemId, fileName), { mkdirp: true }, function (err) {
                                    mv(path.join('.', 'data', dir, fileName.replace('.png', '_thumb.png')), path.join(config.runtime.screenshots_destination, toLog.SystemId, fileName.replace('.png', '_thumb.png')), { mkdirp: true }, function (err) {
                                        console.log(err);
                                        cb(null);
                                    });
                                });
                            },
                            function (err) {
                                //Done
                                callback(err, images, toLog);
                            });
                        },
                        function (images, toLog, callback) {
                            //Update table with moved info
                            if (images && toLog) {
                                db.serialize(function () {
                                    for (var i = 0; i < images.length; i++) {
                                        var oldPath = path.parse(images[i].ImagePath);
                                        var newImagePath = path.join('screenshots', toLog.SystemId, oldPath.base);
                                        db.run("UPDATE tblLogImage SET LogId = ?, SystemId = ?, SystemName = ?, ImagePath = ? WHERE LogId = ?", toLog.LogId, toLog.SystemId, toLog.SystemName, newImagePath, req.params.id);
                                    }
                                    db.run("UPDATE tblLog SET HasImages = 1 WHERE LogId = ?", toLog.LogId, function () {
                                        callback(null);
                                    });
                                });
                            }
                            else {
                                callback(null);
                            }
                        }
                    ],
                    function (err) {
                        //Waterfall complete
                        callbackOuter(err);
                    });
                }
                else {
                    //Skip processing images
                    callbackOuter(null);
                }
            },
            function (callbackOuter) {
                //Delete
                db.serialize(function () { 
                    db.run("DELETE FROM tblJourneyLog WHERE LogId = ?", req.params.id);
                    db.run("DELETE FROM tblLogImage WHERE LogId = ?", req.params.id);
                    db.run("DELETE FROM tblLog WHERE LogId = ?", req.params.id, function (err) {
                        res.send({ status: err ? "notok" : "ok" });
                    });
                })
                db.close();
            }
        ]);
    });

    app.get('/api/systems', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        var param = {};

        var sql = 'SELECT log1.* FROM tblLog log1 LEFT JOIN tblLog log2 ON (log1.SystemId = log2.SystemId AND log1.LogId < log2.LogId) WHERE log2.LogId IS NULL';

        if (req.query && req.query !== null && (req.query.SystemName || req.query.Fav)) {
            param = sqlite3.toNamedParams(req.query);
            if (req.query.SystemName && req.query.SystemName.length > 0) {
                param.$SystemName = "%" + param.$SystemName + "%";
                sql += " AND log1.SystemName LIKE $SystemName";
            }
            else {
                delete (param.$SystemName);
            }
            if (req.query.Fav == 1) {
                sql += " AND log1.SystemId IN (SELECT SystemId FROM tblSystemFav)";
            }
        }

        var sqlCount = sql.replace('SELECT log1.*', 'SELECT COUNT(*) as c');

        sql += ' ORDER BY log1.SystemName ASC';

        if (req.query.pageSize) {
            sql += " LIMIT " + req.query.pageSize;
            if (req.query.page) {
                sql += " OFFSET " + (req.query.page * req.query.pageSize);
            }
        }

        //Delete unqueryable params
        delete (param.$Fav);
        delete (param.$page);
        delete (param.$pageSize);

        db.serialize(function () {
            var count = 0;
            db.get(sqlCount, param, function (err, rows) {
                if (!err && rows)
                    count = rows.c;
            });
            db.all(sql, param, function (err, rows) {
                if (err)
                    console.log(err);
                res.send({ count: count, result: rows || [] });
            });
        });

        db.close();
    });
};