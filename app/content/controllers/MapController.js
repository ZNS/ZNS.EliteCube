angular.module('eliteCube').controller('mapController', ['$scope', '$location', 'profileService', '$routeParams', function ($scope, $location, profileService, $routeParams) {
    $scope.profile = null;

    profileService.getProfile().then(function (result) {
        $scope.profile = result.data;
    });

    $scope.$on('$locationChangeStart', function (e, newPath) {
        if (newPath.indexOf('#') == newPath.length || newPath.indexOf('#') == -1) {
            e.preventDefault();
        }
    });

    Ed3d.init({
        basePath: '/ed3d-galaxy-map/',
        container: 'edmap',
        jsonPath: '/api/map/journey/' + $routeParams.id,
        withHudPanel: true,
        hudMultipleSelect: false,
        startAnim: true
    });
}]);