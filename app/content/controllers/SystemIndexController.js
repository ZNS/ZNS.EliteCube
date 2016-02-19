angular.module('eliteCube').controller('systemIndexController', ['$scope', '$http', 'profileService', '$location', function ($scope, $http, profileService, $location) {
    $scope.systems = [];
    $scope.profile = null;
    $scope.pageData = { pageSize: 50, count: 0 };
    $scope.query = { SystemName: null, Fav: 0 };
    var search = $location.search();
    if (search.SystemName) {
        $scope.query.SystemName = search.SystemName;
    }
    if (search.Fav) {
        $scope.query.Fav = search.Fav;
    }

    profileService.getProfile().then(function (profile) {
        $scope.profile = profile.data;
    });

    $scope.$on('$locationChangeSuccess', function () {
        render();
    });

    $scope.toggleFav = function () {
        $scope.query.Fav = $scope.query.Fav == 0 ? 1 : 0;
        $scope.search();
    };

    $scope.search = function () {
        $location.search($scope.query);
    };

    function render() {
        var param = {
            page: 0,
            pageSize: $scope.pageData.pageSize
        };
        $.extend(param, $location.search());

        $http.get('/api/systems', { params: param }).then(function (response) {
            $scope.pageData.count = response.data.count;
            $scope.systems = response.data.result;
        });
    }

    render();
}]);