angular.module('eliteCube').service('heartService', ['$http', '$q', function ($http, $q) {
    _favourites = [];

    $http.get('/api/fav').then(function (response) {
        _favourites = response.data;
    });

    this.heart = function(systemId) {
        if (!this.isHearted(systemId)) {
            $http.post('/api/fav', { systemId: systemId }).then(function () {
                _favourites.push(systemId);
            });
        }
    };

    this.unHeart = function (systemId) {
        var idx = -1;
        for (var i = 0; i < _favourites.length; i++) {
            if (_favourites[i] === systemId) {
                idx = i;
                break;
            }
        }

        if (idx > -1) {
            $http.delete('/api/fav/' + systemId).then(function () {
                _favourites.splice(idx, 1);
            });
        }
    };

    this.isHearted = function (systemId) {
        var hearted = false;
        angular.forEach(_favourites, function (f) {
            if (f === systemId) {
                hearted = true;
                return false;
            }
        });
        return hearted;
    };
}]);