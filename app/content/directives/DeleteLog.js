angular.module('eliteCube').directive('deleteLog', ['$compile', '$templateRequest', '$http', function ($compile, $templateRequest, $http) {
    return {
        restrict: 'E',
        template: '<button type="button" class="delete" ng-class="textButton ? \'default\' : \'fa fa-times\'" ng-click="confirmDelete()">{{text}}</button>',
        replace: true,
        scope: {
            log: '='
        },
        link: function ($scope, $element, attrs) {
            _layer = null;
            $scope.text = "";
            $scope.textButton = (typeof (attrs.textButton) !== "undefined" && attrs.textButton === "true") ? true : false;
            if ($scope.textButton) {
                $scope.text = "Delete";
            }

            $scope.confirmDelete = function () {
                console.log($scope.log);
                $templateRequest('/partials/deleteLog.html').then(function (template) {
                    _layer = $($compile(template)($scope)).appendTo("body");
                });
            }

            $scope.delete = function (moveImages) {
                $http.delete('/api/log/' + $scope.log.LogId, { params: { moveImages: moveImages } }).then(function () {
                    console.log("deleted");
                    $scope.close();
                });
            }

            $scope.close = function () {
                if (_layer !== null) {
                    _layer.remove();
                }
            };
        }
    };
}]);