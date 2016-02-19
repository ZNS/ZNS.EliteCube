angular.module('eliteCube').directive('logTable', function () {
    return {
        restrict: 'E',
        templateUrl: '/partials/logTable.html',
        scope: {
            log: '='
        },
        link: function (scope, element, attrs, model) {
        }
    };
});