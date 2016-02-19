angular.module('eliteCube').controller('journeyIndexController', ['$scope', '$http', 'profileService', 'journeyService', '$location', function ($scope, $http, profileService, journeyService, $location) {
    $scope.profile = null;
    $scope.journeys = [];
    $scope.pageData = { pageSize: 50, count: 0 };

    profileService.getProfile().then(function (profile) {
        $scope.profile = profile.data;
    });

    journeyService.onJourneyStarted($scope, function () {
        render();
    });

    $scope.$on('$locationChangeSuccess', function () {
        render();
    });

    function render() {
        var param = {
            page: 0,
            pageSize: $scope.pageData.pageSize
        };
        $.extend(param, $location.search());

        $http.get('/api/journey', { params: param }).then(function (response) {
            $scope.journeys = response.data.result;
            $scope.pageData.count = response.data.count;
        });
    }

    render();
}]);