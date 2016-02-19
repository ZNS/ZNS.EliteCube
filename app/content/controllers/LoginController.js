angular.module('eliteCube').controller('loginController', ['$scope', '$location', 'profileService', function ($scope, $location, profileService) {
    $scope.email = "";
    $scope.password = "";

    $scope.login = function () {
        profileService.login($scope.email, $scope.password).then(
            function () {
                $location.path('/');
            },
            function (result) {
                if (result.Status === "PendingVerification") {
                    $location.path("/verify").search('email', $scope.email);
                    return;
                }
                else {
                    //Error
                    alert("Unable to login, wrong credentials?");
                }
            }
        );
    };
}]);