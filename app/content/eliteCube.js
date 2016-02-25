angular.module('eliteCube', ['ngRoute', 'ngCookies'])
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'homeController'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'loginController'
        })
        .when('/verify', {
            templateUrl: 'views/verification.html',
            controller: 'verificationController'
        })
        .when('/log', {
            templateUrl: 'views/logIndex.html',
            controller: 'logIndexController',
            reloadOnSearch: false
        })
        .when('/log/:id', {
            templateUrl: 'views/logEdit.html',
            controller: 'logEditController',
            reloadOnSearch: false
        })
        .when('/system', {
            templateUrl: 'views/systemIndex.html',
            controller: 'systemIndexController',
            reloadOnSearch: false
        })
        .when('/system/:id', {
            templateUrl: 'views/systemView.html',
            controller: 'systemViewController',
            reloadOnSearch: false
        })
        .when('/journey', {
            templateUrl: 'views/journeyIndex.html',
            controller: 'journeyIndexController',
            reloadOnSearch: false
        })
        .when('/journey/:id', {
            templateUrl: 'views/journeyView.html',
            controller: 'journeyViewController',
            reloadOnSearch: false
        })
        .when('/map/journey/:id', {
            templateUrl: 'views/map.html',
            controller: 'mapController',
        });
}])
.run(['$rootScope', function ($rootScope) {
    if (!eliteCubeConfig.video_bg) {
        $(".site-bg > video").remove();
        $(".site-bg").addClass("image");
    }
}]);