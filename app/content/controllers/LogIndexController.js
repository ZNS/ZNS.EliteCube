angular.module('eliteCube').controller('logIndexController', ['$scope', '$http', 'profileService', '$location', function ($scope, $http, profileService, $location) {
    $scope.log = [];
    $scope.profile = null;
    $scope.pageData = { pageSize: 50, count: 0 };

    profileService.getProfile().then(function (profile) {
        $scope.profile = profile.data;
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

        $http.get('/api/log', { params: param }).then(function (response) {
            $scope.pageData.count = response.data.count;
            $scope.log = response.data.result;
        });
    }

    render();
}]);