angular.module('eliteCube').directive('heart', ['heartService', function (heartService) {
    return {
        restrict: 'E',
        template: '<span class="heart fa" ng-class="isHearted() ? \'fa-heart\' : \'fa-heart-o\'" ng-click="toggleHeart()"></span>',
        replace: true,
        scope: {
            systemId: '@'
        },
        link: function ($scope, $element, attrs) {
            $scope.isHearted = function () {
                return heartService.isHearted($scope.systemId);
            }

            $scope.toggleHeart = function () {
                if (heartService.isHearted($scope.systemId)) {
                    heartService.unHeart($scope.systemId);
                }
                else {
                    heartService.heart($scope.systemId);
                }
            };
        }
    };
}]);