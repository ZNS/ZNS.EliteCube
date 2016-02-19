angular.module('eliteCube').service('journeyService', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
    var _currentJourney = null;
    var _init = false;

    this.getCurrentJourney = function() {
        return loadCurrentJourney();
    };

    this.startJourney = function(journey) {
        var qStart = $q.defer();
        loadCurrentJourney().then(function() {
            if (_currentJourney !== null) {
                //End journey
                $http.post('/api/journey/' + _currentJourney.JourneyId + '/end', {date: moment().valueOf() });
            }
            //Create new
            $http.post('/api/journey', journey).then(function(response) {
                _currentJourney = response.data.journey;
                qStart.resolve();
                $rootScope.$emit('journeyStarted');
            });
        });
        return qStart.promise;
    };

    this.endJourney = function () {
        var q = $q.defer();
        loadCurrentJourney().then(function() {
            if (_currentJourney !== null) {
                //End journey
                $http.post('/api/journey/' + _currentJourney.JourneyId + '/end', { date: moment().valueOf() }).then(function () {
                    _currentJourney = null;
                    q.resolve();
                    $rootScope.$emit('journeyEnded');
                });
            }
        });
        return q.promise;
    };

    this.onJourneyStarted = function (scope, callback) {
        var handler = $rootScope.$on('journeyStarted', callback);
        scope.$on('$destroy', handler);
    };

    this.onJourneyEnded = function (scope, callback) {
        var handler = $rootScope.$on('journeyEnded', callback);
        scope.$on('$destroy', handler);
    };

    function loadCurrentJourney(force) {
        force = force || false;
        var qCurrent = $q.defer();

        if (_init && !force) {
            qCurrent.resolve(_currentJourney);
        }
        else {
            $http.get('/api/journey/current', { params: { pageSize: 1 } }).then(function (response) {
                var journey = response.data;
                if (journey && (!journey.EndDate || journey.EndDate === null)) {
                    _currentJourney = journey;
                }
                qCurrent.resolve(_currentJourney);
                _init = true;
            });
        }

        return qCurrent.promise;
    }
}]);