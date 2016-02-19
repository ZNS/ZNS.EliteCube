var fs = require('fs');
var edge = require('edge');
var async = require('async');
var path = require('path');
var sqlite3 = require('sqlite3');
var profile = null;

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

module.exports = function (config, callback) {
    var imagePath = config.screenshot_path;

    fs.stat(config.runtime.screenshots_destination, function (err, stats) {
        if (err && err.code === 'ENOENT') {
            fs.mkdirSync(config.runtime.screenshots_destination);
        }
    });

    if (config.manage_screenshots) {
        fs.watch(imagePath, { persistent: true, recursive: false }, function (event, filename) {
            if (event === 'change') {
                stopCacheInterval();

                async.waterfall([
                    function getProfile(callback) {
                        if (profile === null) {
                            getCompanionProfileData({force: 'true'}, function (error, result) {
                                if (result && result.LoginStatus === "Ok" && result.Json !== null) {
                                    profile = JSON.parse(result.Json);
                                    callback(null);
                                }
                            });
                        }
                        else {
                            callback(null);
                        }
                    },
                    function createDirectory(callback) {
                        if (profile !== null && profile.lastSystem) {
                            fs.stat(path.join(config.runtime.screenshots_destination, profile.lastSystem.id), function (err, stats) {
                                if (err && err.code === 'ENOENT') {
                                    fs.mkdirSync(path.join(config.runtime.screenshots_destination, profile.lastSystem.id));
                                }
                                callback(null);
                            });
                        }
                    },
                    function copyImage(callback) {
                        //Copy image
                        if (profile !== null && profile.lastSystem && (filename.indexOf('.png') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.jpg') > 0)) {
                            copyScreenshot({
                                    imagePath: path.join(imagePath, filename),
                                    destinationPath: path.join(config.runtime.screenshots_destination, profile.lastSystem.id),
                                    maxSize: config.screenshot_maxsize
                                },
                                function (err, result) {
                                    if (!err || err === null) {
                                        //Update db with image info
                                        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
                                        db.serialize(function () {
                                            var dateStamp = new Date().getTime();
                                            result.imagePath = result.imagePath.replace(/\\/g, '/').replace('data/', '/');
                                            db.run("INSERT INTO tblLogImage(LogId, ImagePath, DateStamp) VALUES((SELECT MAX(LogId) FROM tblLog), ?, ?)", result.imagePath, dateStamp);
                                            db.run("UPDATE tblLog SET HasImages = 1 WHERE LogId = (SELECT MAX(LogId) FROM tblLog)");
                                        });
                                        db.close();
                                    }
                                    callback(null);
                                }
                            );
                        }
                    }
                ]);

                startCacheInterval();
            };
        });

        startCacheInterval();
    }

    callback();
};

//Cache profile for 30 seconds
var cacheInterval = null;
function startCacheInterval() {
    cacheInterval = setInterval(function () {
        profile = null;
    }, 30000);
}

function stopCacheInterval() {
    if (cacheInterval !== null) {
        clearInterval(cacheInterval);
    }
}