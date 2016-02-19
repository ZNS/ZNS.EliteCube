var sqlite3 = require('sqlite3');

module.exports = function (app, config) {
    app.get('/api/fav', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.all("SELECT SystemId FROM tblSystemFav", function (err, rows) {
            if (!err && rows) {
                var favs = [];
                for (var i = 0; i < rows.length; i++) {
                    favs.push(rows[i].SystemId);
                }
                return res.send(favs);
            }
            else {
                res.send([]);
            }
        });
        db.close();
    });

    app.post('/api/fav', function(req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.run("INSERT INTO tblSystemFav(SystemId) VALUES(?)", req.body.systemId, function (err) {
            res.send({ status: err ? "notok" : "ok" });
        });
        db.close();
    });

    app.delete('/api/fav/:systemId', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.run("DELETE FROM tblSystemFav WHERE SystemId = ?", req.params.systemId, function (err) {
            res.send({ status: err ? "notok" : "ok" });
        });
        db.close();
    });
};