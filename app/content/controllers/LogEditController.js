angular.module('eliteCube').controller('logEditController', ['$scope', '$http', 'profileService', '$routeParams', '$timeout', '$location', function ($scope, $http, profileService, $routeParams, $timeout, $location) {
    $scope.log = null;
    $scope.profile = null;
    $scope.images = [];
    $scope.logOther = [];
    $scope.pageData = { pageSize: 15, count: 0 };
    var saveTimer = null

    profileService.getProfile().then(function (profile) {
        $scope.profile = profile.data;
    });

    $http.get('/api/log/' + $routeParams.id).then(function (response) {
        $scope.log = response.data.log;

        //Images
        angular.forEach(response.data.images, function (img) {
            var path = img.ImagePath.replace('.png', '_thumb.png');
            $scope.images.push({ path: path, date: img.DateStamp });
        });

        //Other logs for this system
        renderOtherLogs();

        $scope.$watch('log.Notes', debounceSave);
    });

    $scope.$on('$locationChangeSuccess', function () {
        renderOtherLogs();
    });

    function renderOtherLogs() {
        var param = {
            page: 0,
            pageSize: $scope.pageData.pageSize,
            SystemId: $scope.log.SystemId,
            LogId: $scope.log.LogId
        };
        $.extend(param, $location.search());

        $http.get('/api/log', { params: param }).then(function (responseSearch) {
            $scope.pageData.count = responseSearch.data.count;
            $scope.logOther = responseSearch.data.result;
        });
    }

    function debounceSave(newVal, oldVal) {
        if (newVal !== oldVal) {
            if (saveTimer !== null) {
                $timeout.cancel(saveTimer)
            }
            saveTimer = $timeout(save, 2000);
        }
    }

    function save() {
        $http.post('/api/log/' + $scope.log.LogId + '/notes', { notes: $scope.log.Notes }).then(function () {
        });
    }
}]);