angular.module('eliteCube').controller('verificationController', ['$scope', '$location', 'profileService', function ($scope, $location, profileService) {
    $scope.code = "";
    $scope.email = $location.search().email;

    $scope.verify = function () {
        profileService.verify($scope.email, $scope.code).then(
            function () {
                $location.path('/');
            },
            function (result) {
                //Error
                alert("Unable to verify, wrong code?");
            }
        );
    };
}]);