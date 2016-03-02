angular.module('eliteCube').directive('imageList', ['$compile', '$templateRequest', '$http', function ($compile, $templateRequest, $http) {
    return {
        restrict: 'E',
        templateUrl: '/partials/imageList.html',
        scope: {
            images: '='
        },
        link: function (scope, element, attrs, model) {
            var _layer = null;
            scope.imageDelete = null;

            scope.viewImage = function (e, img) {
                e.preventDefault();
                var imgUrl = $(e.target).parent().attr("href");
                $('<div id="image-large"><img src="' + imgUrl + '" alt="" /><span>X</span></div>').appendTo("body").find("span").one("click", function () { $(this).parent().remove(); });
            };

            scope.upload = function (imageId, e) {
                $(e.target).closest("li").addClass("loader");
                $http.post('/api/image/' + imageId + '/imgur').then(function (response) {
                    angular.forEach(scope.images, function (img) {
                        if (img.id === imageId) {
                            img.imgurLink = 'http://imgur.com/' + response.data.id;
                            return false;
                        }
                    });
                    $(e.target).closest("li").removeClass("loader");
                });
            };

            scope.delete = function (imageId) {
                angular.forEach(scope.images, function (img) {
                    if (img.id === imageId) {
                        scope.imageDelete = img;
                    }
                });

                if (scope.imageDelete !== null) {
                    $templateRequest('/partials/deleteImage.html').then(function (template) {
                        _layer = $($compile(template)(scope)).appendTo("body");
                    });
                }
            };

            scope.deleteImage = function (deleteImgur) {
                $http.delete('/api/image/' + scope.imageDelete.id, { params: { deleteImgur: deleteImgur ? 1 : 0 } }).then(function () {
                    scope.close();
                });
            };

            scope.deleteImgur = function () {
                $http.delete('/api/image/' + scope.imageDelete.id + '/imgur').then(function () {
                    scope.imageDelete.imgurLink = null;
                    scope.close();
                });
            };

            scope.close = function () {
                if (_layer !== null) {
                    _layer.remove();
                }
                scope.imageDelete = null;
            };
        }
    };
}]);