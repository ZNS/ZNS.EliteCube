var sqlite3 = require('sqlite3');

sqlite3.toNamedParams = function (obj) {
    var param = {};
    for (var prp in obj) {
        param['$' + prp] = obj[prp];
    }
    return param;
};

module.exports = function (app, config) {
    app.get('/api/journey/current', function(req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.get("SELECT * FROM tblJourney ORDER BY StartDate DESC LIMIT 1", function(err, row) {
            if (err)
                console.log(err);
            res.send(row);
        });
        db.close();
    });

    app.get('/api/journey', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        var param = {};

        var sql = "SELECT j.JourneyId, j.Heading, j.StartDate, j.EndDate, COUNT(jl.LogId) as LogCount FROM tblJourney as j LEFT JOIN tblJourneyLog as jl ON j.JourneyId = jl.JourneyId GROUP BY j.JourneyId, j.Heading, j.StartDate, j.EndDate";

        var sqlCount = sql.replace("SELECT *", "SELECT COUNT(*)");

        sql = sql + " ORDER BY j.StartDate DESC";
        if (req.query.pageSize) {
            sql += " LIMIT " + req.query.pageSize;
            if (req.query.page) {
                sql += " OFFSET " + (req.query.page * req.query.pageSize);
            }
        }

        db.serialize(function () {
            var count = 0;
            db.get(sqlCount, param, function (err, row) {
                if (!err && row)
                    count = row.c;
            });
            db.all(sql, param, function (err, rows) {
                if (err)
                    console.log(err);
                res.send({ count: count, result: rows || [] });
            });
        });

        db.close();
    });

    app.post('/api/journey', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);

        var param = sqlite3.toNamedParams(req.body);
        db.run("INSERT INTO tblJourney(Heading, Description, StartDate) VALUES($Heading, $Description, $StartDate)", param, function (err, row) {
            if (!err) {
                var journey = req.body;
                journey.JourneyId = this.lastID;
                res.send({ status: "ok", journey: journey });
            }
            else {
                res.send({ status: "notok" });
            }
        });

        db.close();
    });

    app.get('/api/journey/:id', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.serialize(function () {
            var images = [];
            db.all("SELECT img.ImagePath, img.DateStamp, log.SystemName FROM tblLogImage as img INNER JOIN tblLog as log ON img.LogId = log.LogId WHERE img.LogId IN (SELECT tblJourneyLog.LogId FROM tblJourneyLog WHERE JourneyId = ?) ORDER BY img.DateStamp DESC", req.params.id, function (err, rows) {
                images = rows || [];
            });
            db.get("SELECT * FROM tblJourney WHERE JourneyId = ?", req.params.id, function (err, row) {
                if (err)
                    console.log(err);
                res.send({ journey: row, images: images });
            });
        });
        db.close();
    });

    app.get('/api/journey/:id/logs', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        
        var sql = "SELECT * FROM tblLog WHERE LogId IN (SELECT LogId FROM tblJourneyLog WHERE JourneyId = ?)";
        var sqlCount = sql.replace("SELECT *", "SELECT COUNT(*) as c");

        sql += " ORDER BY DateStamp DESC";

        if (req.query.pageSize) {
            sql += " LIMIT " + req.query.pageSize;
            if (req.query.page) {
                sql += " OFFSET " + (req.query.page * req.query.pageSize);
            }
        }

        db.serialize(function () {
            var count = 0;
            db.get(sqlCount, req.params.id, function (err, row) {
                if (!err && row)
                    count = row.c;
            });
            db.all(sql, req.params.id, function (err, rows) {
                if (err)
                    console.log(err);
                res.send({ count: count, result: rows || [] });
            });
        });
        db.close();
    });

    app.post('/api/journey/:id/end', function (req, res) {
        var db = new sqlite3.Database(config.runtime.db_conn, sqlite3.OPEN_READWRITE);
        db.run("UPDATE tblJourney SET EndDate = ? WHERE JourneyId = ?", req.body.date, req.params.id, function (err) {
            res.send({ status: err ? "notok" : "ok" });
        });
        db.close();
    });
};