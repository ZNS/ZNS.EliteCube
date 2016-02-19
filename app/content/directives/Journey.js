angular.module('eliteCube').directive('journeyNew', ['$compile', '$templateRequest', 'journeyService', function ($compile, $templateRequest, journeyService) {
    return {
        restrict: 'E',
        template: '<button class="journey" type="button" ng-click="newJourney()">Start new journey</button>',
        replace: true,
        scope: true,
        link: function ($scope, $element, attrs) {
            $scope.heading = "";
            $scope.description = "";
            var _form = null;

            $scope.close = function () {
                if (_form !== null) {
                    _form.remove();
                }
            };

            $scope.newJourney = function () {
                $templateRequest('/partials/journeyForm.html').then(function (template) {
                    _form = $($compile(template)($scope)).appendTo("body");
                });
            };

            $scope.submitNewJourney = function () {
                if ($scope.heading.length > 0) {
                    journeyService.startJourney({
                        Heading: $scope.heading,
                        Description: $scope.description,
                        StartDate: moment().valueOf()
                    });
                    $scope.close();
                }
            };
        }
    };
}]);