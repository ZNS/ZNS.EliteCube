var sqlite3 = require('sqlite3');
var path = require('path');
var fs = require('fs');

module.exports = function (config, callback) {
    fs.stat(config.runtime.db_path, function (err, stats) {
        if (err && err.code === 'ENOENT') {
            fs.mkdirSync(config.runtime.db_path);
        }
        fs.stat(config.runtime.db_conn, function (err, stats) {
            if (err && err.code === 'ENOENT') {
                var db = new sqlite3.Database(config.runtime.db_conn);

                //Create tables
                db.serialize(function () {
                    db.run("CREATE TABLE tblLog (" +
                        "LogId INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "DateStamp INTEGER NOT NULL," +
                        "SystemId TEXT NOT NULL," + 
                        "SystemName TEXT NOT NULL," +
                        "Allegiance TEXT," +
                        "Government TEXT," +
                        "Population INTEGER DEFAULT 0," +
                        "Faction TEXT," +
                        "Economy TEXT," +
                        "CoordX REAL," + 
                        "CoordY REAL," +
                        "CoordZ REAL," + 
                        "StationName TEXT," +
                        "Notes TEXT," + 
                        "HasImages INTEGER DEFAULT 0)");
                    db.run("CREATE TABLE tblSystemFav (" +
                        "FavId INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "SystemId TEXT NOT NULL)");
                    db.run("CREATE TABLE tblJourney (" +
                        "JourneyId INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "Heading TEXT NOT NULL," +
                        "Description TEXT," +
                        "StartDate INTEGER NOT NULL," +
                        "EndDate INTEGER)");
                    db.run("Create TABLE tblJourneyLog (" +
                        "Id INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "JourneyId INTEGER NOT NULL," +
                        "LogId INTEGER NOT NULL)");
                    db.run("CREATE TABLE tblLogImage (" +
                        "LogImageId INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "LogId INTEGER NOT NULL," +
                        "ImagePath TEXT NOT NULL," +
                        "SystemId TEXT NOT NULL," +
                        "SystemName TEXT NOT NULL," +
                        "DateStamp INTEGER NOT NULL)");
                    db.run("PRAGMA user_version = " + config.runtime.db_version, function (err) {
                        callback(null);
                    });
                });

                db.close();
            }
            else {
                var db = new sqlite3.Database(config.runtime.db_conn);

                db.get("PRAGMA user_version", function (err, row) {
                    var version = row.user_version;
                    db.serialize(function () {
                        if (version < config.runtime.db_version) {
                            if (version <= 2) {
                                db.run("ALTER TABLE tblLogImage ADD COLUMN SystemId TEXT NOT NULL DEFAULT ''");
                                db.run("ALTER TABLE tblLogImage ADD COLUMN SystemName TEXT NOT NULL DEFAULT ''");
                                db.run("UPDATE tblLogImage SET SystemId = (SELECT SystemId FROM tblLog WHERE tblLog.LogId = tblLogImage.LogId)");
                                db.run("UPDATE tblLogImage SET SystemName = (SELECT SystemName FROM tblLog WHERE tblLog.LogId = tblLogImage.LogId)");
                                db.all("SELECT * FROM tblLogImage", function (err, rows) {
                                    console.log(rows);
                                });
                            }
                            db.run("PRAGMA user_version = " + config.runtime.db_version);
                        }

                        //Clean up
                        db.run("DELETE FROM tblSystemFav WHERE SystemId NOT IN (SELECT DISTINCT SystemId FROM tblLog)", function (err) {
                            callback(null);
                        });
                    });
                    db.close();
                });
            }
        });
    });
};