angular.module('eliteCube').directive('pager', ['$location', function ($location) {
    return {
        restrict: 'E',
        templateUrl: '/partials/pager.html',
        replace: true,
        scope: {
            pageData: '='
        },
        link: function (scope, $element, attrs) {
            scope.page = $location.search().page || 0;

            scope.$watch('pageData.count', function (val) {
                var pageCount = parseInt(Math.ceil(parseFloat(scope.pageData.count) / parseFloat(scope.pageData.pageSize)));

                if (pageCount <= 1) {
                    $element.hide();
                }
                else {
                    $element.show();
                    scope.pages = [];
                    for (var i = 0; i < pageCount; i++) {
                        scope.pages.push({ page: i });
                    }
                }
            });

            scope.viewPage = function (page) {
                scope.page = page;
                $location.search('page', page);
            };
        }
    };
}]);