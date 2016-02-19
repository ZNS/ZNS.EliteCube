angular.module('eliteCube').controller('mainController', ['$scope', 'profileService', '$timeout', '$window', '$interval', function ($scope, profileService, $timeout, $window, $interval) {
    $scope.profileUpdating = false;
    $scope.secondsLeft = 62;
    $scope.updatePaused = false;
    var _timer = null;

    profileService.onProfile($scope, function () {
        $scope.secondsLeft = 61;
        if (_timer != null) {
            $interval.cancel(_timer);
        }
        if (!$scope.updatePaused) {
            _timer = $interval(function () { $scope.secondsLeft -= 1; }, 1000);
        }
        else {
            $scope.secondsLeft = 60;
        }
    });

    $scope.toggleUpdate = function () {
        $scope.updatePaused = !$scope.updatePaused;
        if ($scope.updatePaused) {
            $interval.cancel(_timer);
            $scope.secondsLeft = 60;
            profileService.stopUpdates();
        }
        else {
            profileService.startUpdates();
            _timer = $interval(function () { $scope.secondsLeft -= 1; }, 1000);
        }
    };

    $scope.back = function () {
        $window.history.back();
    };

    $scope.forward = function () {
        $window.history.forward();
    };

    $scope.updateProfile = function () {
        if (!$scope.profileUpdating) {
            $scope.profileUpdating = true;
            profileService.getProfile(true);
            $timeout(function () {
                $scope.profileUpdating = false;
            }, 15000);
        }
    };
}]);