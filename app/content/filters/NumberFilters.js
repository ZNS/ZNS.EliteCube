angular.module('eliteCube')
.filter('delimited', function () {
    return function (input) {
        if (input && input !== null) {
            return input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        return input;
    };
})