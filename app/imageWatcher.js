var fs = require('fs');
var edge = require('edge');
var async = require('async');
var path = require('path');
var sqlite3 = require('sqlite3');
var handledImages = [];

var getCompanionProfileData = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'GetProfileData'
});

var copyScreenshot = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.ImageHandler',
    methodName: 'CopyScreenshot'
});

module.exports = function (config, callbackModule) {
    var imagePath = config.screenshot_path;

    fs.stat(config.runtime.screenshots_destination, function (err, stats) {
        if (err && err.code === 'ENOENT') {
            fs.mkdirSync(config.runtime.screenshots_destination);
        }
    });

    if (config.manage_screenshots) {
        fs.watch(imagePath, { persistent: true, recursive: false }, function (event, filename) {
            if (event === 'change') {
                if (handledImages.indexOf(filename) > -1) {
                    return;
                }
                handledImages.push(filename);

                var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
                async.waterfall([
                    function getLastLog(callback) {
                        db.get("SELECT * FROM tblLog ORDER BY LogId DESC LIMIT 1", function (err, row) {
                            callback(null, row);
                        });
                    },
                    function createDirectory(log, callback) {
                        if (log) {
                            fs.stat(path.join(config.runtime.screenshots_destination, log.SystemId), function (err, stats) {
                                if (err && err.code === 'ENOENT') {
                                    fs.mkdirSync(path.join(config.runtime.screenshots_destination, log.SystemId));
                                }
                                callback(null, log);
                            });
                        }
                        else {
                            callback(null, null);
                        }
                    },
                    function copyImage(log, callback) {
                        //Copy image
                        if (log && (filename.indexOf('.png') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.jpg') > 0)) {
                            copyScreenshot({
                                    imagePath: path.join(imagePath, filename),
                                    destinationPath: path.join(config.runtime.screenshots_destination, profile.lastSystem.id),
                                    maxSize: config.screenshot_maxsize
                                },
                                function (err, result) {
                                    if (result.error)
                                        console.log(result.error);
                                    if (!err || err === null) {
                                        //Update db with image info                                        
                                        db.serialize(function () {
                                            var dateStamp = new Date().getTime();
                                            result.imagePath = result.imagePath.replace(/\\/g, '/').replace('data/', '/');
                                            db.run("INSERT INTO tblLogImage(LogId, ImagePath, SystemId, SystemName, DateStamp) VALUES(?, ?, ?, ?, ?)", log.LogId, result.imagePath, log.SystemId, log.SystemName, dateStamp, function (err) {
                                                if (err)
                                                    console.log(err);
                                            });
                                            db.run("UPDATE tblLog SET HasImages = 1 WHERE LogId = ?", log.LogId, function (err) {
                                                if (err)
                                                    console.log(err);
                                                callback(null);
                                            });
                                        });
                                    }
                                    else {
                                        callback(err);
                                    }
                                }
                            );
                        }
                        else {
                            callback(null);
                        }
                    }
                ], function (err, result) {
                    db.close();
                });
            };
        });
    }
    callbackModule();
};