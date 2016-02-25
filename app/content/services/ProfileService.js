angular.module('eliteCube').service('profileService', ['$rootScope', '$http', '$interval', '$q', '$cookies', '$timeout', function ($rootScope, $http, $interval, $q, $cookies, $timeout) {
    var COMBAT_RANKS = ["Harmless", "Mostly harmless", "Novice", "Competent", "Expert", "Master", "Dangerous", "Deadly", "Elite"];
    var TRADE_RANKS = ["Penniless", "Mostly penniless", "Peddler", "Dealer", "Merchant", "Broker", "Entrepreneur", "Tycoon", "Elite"];
    var EXPLORE_RANKS = ["Aimless", "Mostly aimless", "Scout", "Surveyor", "Trailblazer", "Pathfinder", "Ranger", "Pioneer", "Elite"];
    var CQC_RANKS = ["Helpless", "Mostly helpless", "Amateur", "Semi professional", "Professional", "Champion", "Hero", "Legend", "Elite"];
    var FED_RANKS = ["No rank", "Recruit", "Cadet", "Midshipman", "Petty officer", "Warrant officer", "Ensign", "Liutenant", "Liutenant Commander", "Post Commander", "Post Captain", "Read Admiral", "Vice Admiral", "Admiral"];
    var EMPIRE_RANKS = ["No rank", "Outsider", "Serf", "Master", "Squire", "Knight", "Lord", "Baron", "Viscount", "Count", "Earl", "Marquis", "Duke", "Prince", "King"];
    var LOGIN_COOKIE = "loginEmail"
    var COOKIE_DOMAIN = null;

    var _autoUpdate = true;
    var _timer = null;
    var _profileStatus = "Ok";
    var _profile = null;
    var _profileResolved = false;
    var _profileEmail = null;

    //User successfully logged in
    function resolveProfile() {
        var qResolveProfile = $q.defer();

        //Profile already resolved
        if (_profileResolved) {
            qResolveProfile.resolve();
            return qResolveProfile.promise;
        }

        //Get profile email from cookie
        _profileEmail = $cookies.get(LOGIN_COOKIE);
        if (_profileEmail == null) {
            qResolveProfile.reject({ status: "NoCookie" });
            return qResolveProfile.promise;
        }

        //Load profile
        $http.get('/api/profile', { params: { email: _profileEmail } }).then(function (response) {
            if (response.data.status === "ok") {
                _profileResolved = true;
                qResolveProfile.resolve();
                resetTimer();
            }
            else {
                //Unable to set profile
                qResolveProfile.reject(response.data);
            }
        });

        return qResolveProfile.promise;
    };

    function resetTimer() {
        if (_timer != null) {
            $interval.cancel(_timer);
        }
        if (_autoUpdate) {
            _timer = $interval(function () {
                loadProfile(false);
            }, 62000);
        }
    }

    this.startUpdates = function () {
        _autoUpdate = true;
        resetTimer();
        loadProfile(false);
    };

    this.stopUpdates = function () {
        _autoUpdate = false;
        $interval.cancel(_timer);
    };

    //Login, creates new profile and logins
    this.login = function (email, password) {
        var qLogin = $q.defer();
        $http.post('/api/profile', { email: email, password: password }).then(function () {
            _profileEmail = email;
            _profileResolved = true;
            $http.post('/api/profile/login').then(function (response) {
                var result = response.data;
                if (result.LoginStatus == "Ok") {
                    //User was created and successfully logged in
                    $cookies.put(LOGIN_COOKIE, email, { domain: COOKIE_DOMAIN, path: '/', secure: false, expires: moment().add(3, 'y').toDate() });
                    qLogin.resolve(result);
                    return;
                }
                qLogin.reject(result);
            });
        });
        return qLogin.promise;
    };

    this.verify = function (email, code) {
        var qVerify = $q.defer();
        if (_profileResolved) {
            $http.post('/api/profile/verify', { code: code }).then(function (response) {
                var result = response.data;
                if (result.Success) {
                    //User was created and successfully logged in
                    $cookies.put(LOGIN_COOKIE, email, { domain: COOKIE_DOMAIN, path: '/', secure: false, expires: moment().add(3, 'y').toDate() });
                    qVerify.resolve(result);
                    return;
                }
                qVerify.reject(result);
            });
        }
        else {
            //Profile not loaded
            qVerify.reject();
        }
        return qVerify.promise;
    };

    this.getProfile = function (force) {
        force = force || false;
        var qProfile = $q.defer();
        if (_profile !== null && !force) {
            //Return cached profile
            qProfile.resolve({
                data: _profile,
                status: _profileStatus
            });
        }
        else {
            loadProfile(force).then(function () {
                resetTimer();
                qProfile.resolve({
                    data: _profile,
                    status: _profileStatus
                });
            },
            function (result) {
                resetTimer();
                qProfile.reject(result);
            });
        }
        return qProfile.promise;
    };

    this.onTravel = function (scope, callback) {
        var handler = $rootScope.$on('travel', callback);
        scope.$on('$destroy', handler);
    };

    this.onProfile = function (scope, callback) {
        var handler = $rootScope.$on('profileLoaded', callback);
        scope.$on('$destroy', handler);
    };

    function loadProfile(force) {
        force = force || false;
        var qProfileInternal = $q.defer();
        resolveProfile().then(function () {
            $http.get('/api/profile/data', { params: { force: force } }).then(function (response) {
                var result = response.data;
                console.log('Pulled profile: ' + moment().format("HH:mm:ss") + " cached: " + result.Cached.toString());

                //Request to get profile failed
                if (result.HttpStatusCode !== "OK" && result.HttpStatusCode !== "Found" && result.HttpStatusCode !== "MovedPermanently") {
                    if (_profile !== null) {
                        //Return cached profile
                        qProfileInternal.resolve();
                    }
                    else {
                        qProfileInternal.reject(result);
                    }
                    return;
                }

                _profileStatus = result.LoginStatus;
                //Not logged in
                if (_profileStatus !== "Ok") {
                    qProfileInternal.reject(result);
                    return;
                }

                var profile = JSON.parse(result.Json);

                //Persist to log
                var persisted = false;
                shouldPersist(profile).then(function () {
                    console.log("Persisted", profile.lastSystem);
                    persisted = true;
                    var stationName = null;
                    if (profile.lastStarport.id !== _profile.lastStarport.id) {
                        stationName = profile.lastStarport.name;
                    }
                    $http.post('/api/log', { SystemId: profile.lastSystem.id, SystemName: profile.lastSystem.name, StationName: stationName }).then(function () {
                        $rootScope.$emit('travel');
                    });;
                });

                _profile = profile;
                $rootScope.$emit('profileLoaded', _profile);

                console.log(_profile);

                //Percentages
                _profile.ship.fuel.main.level = _profile.ship.fuel.main.level.toFixed(2);
                _profile.ship.fuel.main.percentage = Math.round(parseFloat(_profile.ship.fuel.main.level) / parseFloat(_profile.ship.fuel.main.capacity) * 100)

                //Ranking names
                _profile.commander.rank.combatName = COMBAT_RANKS[_profile.commander.rank.combat];
                _profile.commander.rank.tradeName = TRADE_RANKS[_profile.commander.rank.trade];
                _profile.commander.rank.exploreName = EXPLORE_RANKS[_profile.commander.rank.explore];
                _profile.commander.rank.cqcName = CQC_RANKS[_profile.commander.rank.cqc];
                _profile.commander.rank.federationName = FED_RANKS[_profile.commander.rank.federation];
                _profile.commander.rank.empireName = EMPIRE_RANKS[_profile.commander.rank.empire];

                qProfileInternal.resolve();
            });
        },
        //Unable to load profile
        function (result) {
            qProfileInternal.reject(result);
        });
        return qProfileInternal.promise;
    }

    function shouldPersist(profile)
    {
        var qPersist = $q.defer();
        if (_profile == null) {
            //Check if same as first in db
            $http.get('/api/log', { params: { pageSize: 1 } }).then(function (response) {
                if (response.data.result.length > 0) {
                    var log = response.data.result[0];
                    if (profile.lastSystem.id !== log.SystemId || (profile.commander.docked && profile.lastStarport.name !== log.StationName)) {
                        qPersist.resolve();
                    }
                }
                else {
                    //No log
                    qPersist.resolve();
                }
            });
        }
        else if (profile.lastSystem.id !== _profile.lastSystem.id || profile.lastStarport.id !== _profile.lastStarport.id) {
            qPersist.resolve();
        }
        return qPersist.promise;
    }
}]);