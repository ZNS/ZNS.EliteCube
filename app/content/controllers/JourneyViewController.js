angular.module('eliteCube').controller('journeyViewController', ['$scope', '$http', 'profileService', 'journeyService', '$routeParams', '$location', function ($scope, $http, profileService, journeyService, $routeParams, $location) {
    $scope.profile = null;
    $scope.journey = null;
    $scope.log = [];
    $scope.images = [];
    $scope.logCount = 0;
    $scope.pageData = { pageSize: 10, count: 0 };

    profileService.getProfile().then(function (result) {
        $scope.profile = result.data;
    });

    profileService.onTravel($scope, function () {
        render();
        if ($scope.pageData.page !== 0) {
            $location.search('page', 0);
        }
        else {
            renderLogs();
        }
    });

    $scope.$on('$locationChangeSuccess', function () {
        renderLogs();
    });

    $scope.endJourney = function () {
        journeyService.endJourney().then(function () {
            render();
        });
    };

    function render() {
        $http.get('/api/journey/' + $routeParams.id).then(function (response) {
            $scope.journey = response.data.journey;

            angular.forEach(response.data.images, function (img) {
                $scope.images.push({
                    path: img.ImagePath.replace('.png', '_thumb.png'),
                    date: img.DateStamp,
                    system: img.SystemName
                });
            });
        });
    }

    function renderLogs() {
        var param = {
            page: 0,
            pageSize: $scope.pageData.pageSize,
        };
        $.extend(param, $location.search());

        $http.get('/api/journey/' + $routeParams.id + '/logs', { params: param }).then(function (response) {
            $scope.log = response.data.result;
            $scope.logCount = response.data.count;
        });
    }

    render();
    renderLogs();
}]);