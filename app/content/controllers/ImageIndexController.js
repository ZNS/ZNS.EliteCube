angular.module('eliteCube').controller('imageIndexController', ['$scope', '$http', 'profileService', '$location', function ($scope, $http, profileService, $location) {
    $scope.profile = null;
    $scope.images = [];
    $scope.pageData = { pageSize: 25, count: 0 };

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

        $http.get('/api/images', { params: param }).then(function (response) {
            angular.forEach(response.data.result, function (img) {
                $scope.images.push({ id: img.LogImageId, path: img.ImagePath, date: img.DateStamp, system: img.SystemName, imgurLink: img.ImgurLink });
            });;
            $scope.pageData.count = response.data.count;
        });
    }

    render();
}]);