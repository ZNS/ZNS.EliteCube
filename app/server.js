var express = require('express');
var lessMiddleware = require('less-middleware');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var interceptor = require('express-interceptor');
var app;
var cachedIndexHtml = null;

var start = function (config, callback) {
    app = express();

    //Parse http post body
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    //Angular app route
    app.get('/', function (req, res) {
        //Inject config into html-file, for use in angular
        res.set('Content-Type', 'text/html');
        if (cachedIndexHtml === null) {
            fs.readFile(path.join(__dirname, 'content', 'index.html'), "utf-8", (err, data) => {
                var json = JSON.stringify(config.client).replace(/\"([^(\")"]+)\":/g, "$1:");
                data = data.replace("/*{CONFIG}*/", "window.eliteCubeConfig = " + json + ";");
                cachedIndexHtml = data;
                res.send(data);
            });
        }
        else {
            res.send(cachedIndexHtml);
        }
    });

    //Less
    app.use(lessMiddleware(path.join(__dirname, 'content')));
    //Auto prefixer
    app.use(interceptor(function (req, res, next) {
        return {
            isInterceptable: function(){
                return /text\/css/.test(res.get('Content-Type'));
            },
            intercept: function (body, send) {
                postcss([autoprefixer({ browsers: ['last 2 versions'] })]).process(body).then(function (result) {
                    result.warnings().forEach(function (warn) {
                        console.warn(warn.toString());
                    });
                    send(result.css);
                });
            }
        };
    }));

    //Static content
    app.use(express.static(path.join(__dirname, 'content')));
    app.use('/screenshots', express.static(config.runtime.screenshots_destination));

    //Routes
    require('./api/profile')(app, config);
    require('./api/log')(app, config);
    require('./api/image')(app, config);
    require('./api/fav')(app, config);
    require('./api/journey')(app, config);
    require('./api/map')(app, config);

    app.listen(config.nodejs_port, function () {
        console.log('Listening on port ' + config.nodejs_port);
    });

    callback(null);
};

module.exports = start;