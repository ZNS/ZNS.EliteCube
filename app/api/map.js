var sqlite3 = require('sqlite3');

module.exports = function (app, config) {
    app.get('/api/map/journey/:id', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.all("SELECT DISTINCT SystemName, CoordX, CoordY, CoordZ FROM tblLog WHERE CoordX IS NOT NULL AND CoordY IS NOT NULL AND CoordZ IS NOT NULL AND LogId IN (SELECT LogId FROM tblJourneyLog WHERE JourneyId = ?)", req.params.id, function (err, rows) {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            var mapdata = [];
            for (var i = 0; i < rows.length; i++) {
                mapdata.push({
                    name: rows[i].SystemName,
                    coords: {
                        x: rows[i].CoordX,
                        y: rows[i].CoordY,
                        z: rows[i].CoordZ
                    }
                });
            }
            res.send(mapdata);
        });
        db.close();
    });
};