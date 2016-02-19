var edge = require('edge');

var loadCompanionProfile = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'LoadProfile'
});

var createCompanionProfile = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'CreateProfile'
});

var getCompanionProfileData = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'GetProfileData'
});

var verifyCompanionProfile = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'SubmitVerification'
});

var loginCompanionProfile = edge.func({
    assemblyFile: 'ZNS.EliteCube.exe',
    typeName: 'ZNS.EliteCube.Models.EliteCompanionProxy',
    methodName: 'Login'
});

module.exports = function (app) {
    app.get('/api/profile', function (req, res) {
        loadCompanionProfile(req.query.email, function (error, result) {
            res.send(result);
        });
    });

    app.post('/api/profile', function (req, res) {
        createCompanionProfile({ email: req.body.email, password: req.body.password }, function (error, result) {
            res.send(result);
        });
    });

    app.post('/api/profile/verify', function (req, res) {
        verifyCompanionProfile(req.body.code, function (error, result) {
            res.send(result);
        });
    });

    app.post('/api/profile/login', function (req, res) {
        loginCompanionProfile({}, function (error, result) {
            res.send(result);
        });
    });

    app.get('/api/profile/data', function (req, res) {
        var force = req.query.force || false;
        getCompanionProfileData({force: force}, function (error, result) {
            res.send(result);
        });
    });
};