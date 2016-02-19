angular.module('eliteCube').controller('homeController', ['$scope', '$rootScope', '$http', '$location', 'profileService', 'journeyService', function ($scope, $rootScope, $http, $location, profileService, journeyService) {
    $scope.profile = null;
    $scope.log = [];
    $scope.currentJourney = null;

    profileService.onTravel($scope, function () {
        render();
    });

    journeyService.onJourneyStarted($scope, function () {
        renderJourney();
    });

    $scope.deleteLog = function (logId) {
        if (confirm('Delete this record?')) {
            $http.delete('/api/log/' + logId).then(function () {
                render();
            });
        }
    };

    function renderJourney() {
        journeyService.getCurrentJourney().then(function (journey) {
            $scope.currentJourney = journey;
        });
    }

    //Get profile data
    function render() {
        profileService.getProfile().then(function (result) {
            $scope.profile = result.data;

            //History
            $http.get('/api/log', { params: { pageSize: 10 } }).then(function (response) {
                $scope.log = response.data.result;
            });

            //Collect trade data
            $scope.buy = [];
            $scope.sell = [];
            angular.forEach($scope.profile.lastStarport.commodities, function (c) {
                if (c.buyPrice < c.sellPrice) {
                    //Station is buying
                    if (parseFloat(c.sellPrice) / parseFloat(c.meanPrice) >= 1.5) {
                        $scope.sell.push(c);
                    }
                }
                else if (c.buyPrice > c.sellPrice) {
                    //Station is selling
                    if (parseFloat(c.meanPrice) / parseFloat(c.buyPrice) >= 1.5) {
                        $scope.buy.push(c);
                    }
                }
            });
        },
        //Failed
        function (result) {
            if (!result.HttpStatusCode) { //Ignore failed profile requests
                if (result.status === "PendingVerification") {
                    //Redirect to 
                    $location.path("/verify");
                }
                else if (result.status !== "Ok") {
                    //Redirect to login
                    $location.path("/login");
                }
            }
        });
    }

    render();
    renderJourney();

    $scope.names = function (items) {
        var names = [];
        angular.forEach(items, function (i) {
            names.push(i.name);
        });
        return names.join(", ");
    };
}]);