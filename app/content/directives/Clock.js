angular.module('eliteCube').directive('clock', ['$filter', '$interval', function ($filter, $interval) {
    return {
        restrict: 'E',
        template: '<div></div>',
        replace: true,
        link: function (scope, $element, attrs) {
            var gameTimeFilter = $filter('toGameTime');
            $interval(function () {
                $element.text(gameTimeFilter(moment()));
            }, 1000);
        }
    };
}]);