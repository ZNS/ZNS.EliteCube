angular.module('eliteCube').controller('systemViewController', ['$scope', '$http', 'profileService', '$routeParams', '$location', function ($scope, $http, profileService, $routeParams, $location) {
    $scope.profile = null;
    $scope.system = null;
    $scope.log = [];
    $scope.images = [];
    $scope.pageData = { pageSize: 10, count: 0 };
    var imagesRendered = false;

    profileService.getProfile().then(function (result) {
        $scope.profile = result.data;
    });

    $scope.$on('$locationChangeSuccess', function () {
        renderLogs();
    });

    $scope.toggle = function (log) {
        log.Expanded = !log.Expanded;
    };

    function renderLogs() {
        var param = {
            page: 0,
            pageSize: $scope.pageData.pageSize,
            SystemId: $routeParams.id,
        };
        $.extend(param, $location.search());

        //Logs
        $http.get('/api/log', { params: param }).then(function (response) {
            $scope.pageData.count = response.data.count;
            var result = response.data.result;
            $scope.system = result[0];
            $scope.log = result;

            if (!imagesRendered) {
                renderImages();
            }
        });
    }

    function renderImages() {
        //Images
        $http.get('/api/images/' + $scope.system.SystemId).then(function (responseImages) {
            angular.forEach(responseImages.data, function (img) {
                if (img.path.indexOf('_thumb.png') > 0) {
                    img.date = img.created;
                    $scope.images.push(img);
                }
            });
        });
        imagesRendered = true;
    }

    renderLogs();
}]);