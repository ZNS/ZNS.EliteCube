angular.module('eliteCube').directive('imageList', function () {
    return {
        restrict: 'E',
        templateUrl: '/partials/imageList.html',
        scope: {
            images: '='
        },
        link: function (scope, element, attrs, model) {
            scope.viewImage = function (e, img) {
                e.preventDefault();
                var imgUrl = $(e.target).parent().attr("href");
                $('<div id="image-large"><img src="' + imgUrl + '" alt="" /><span>X</span></div>').appendTo("body").find("span").one("click", function () { $(this).parent().remove(); });;
            };
        }
    };
});