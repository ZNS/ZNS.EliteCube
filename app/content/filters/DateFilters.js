angular.module('eliteCube')
.filter('toRelativeDate', function () {
    return function (input) {
        if (!input) {
            return "";
        }
        return moment(input).fromNow();
    };
})
.filter('toGameTime', function () {
    return function (input) {
        if (!input) {
            return "";
        }
        return moment(input).utc().add(1286, 'year').format('MMM D, YYYY HH:mm');
    }
})
.filter('toDateString', function () {
    return function (input, withTime) {
        if (!input) {
            return "";
        }
        var fmt = !withTime ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm';
        return moment(input).format(fmt);
    };
})
.filter('dateDiff', function () {
    return function (start, end, interval) {
        var ms = moment(end || moment()).diff(start);
        var duration = moment.duration(ms);
        return duration.days() + " days, " + duration.hours() + " hours, " + duration.minutes() + " minutes";
    };
});