angular.module('eliteCube').service('warningService', ['profileService', '$rootScope', function (profileService, $rootScope) {
    var MODULE_WARNING_LEVELS = [10000, 25000, 50000];

    var _warnings = [];
    profileService.onProfile($rootScope, profileLoaded);

    function profileLoaded(e, profile) {
        if (profile) {
            if (profile.ship && profile.ship.modules) {
                var modules = profile.ship.modules;
                for (var prp in modules) {
                    var m = modules[prp];
                    if (m.module && m.module.health) {
                        m.module.friendlyName = prp.toString();



                    }
                }
            }
        }
        console.log("Modules", _modules);
    }

    function getWarningLevel(moduleFriendlyName, health) {
        var warning_level = 0;
        for (var i = 0; i < MODULE_WARNING_LEVELS.length; i++) {
            if (MODULE_WARNING_LEVELS[i] > health) {
                warning_level = MODULE_WARNING_LEVELS[i];
                break;
            }
        }

        if (warning_level != 0) {
            for (var i = 0; i < _warnings.length; i++) {
                if (_warnings[i].friendlyName === moduleFriendlyName) {
                    if (_warnings[i].levels.indexOf(warning_level) == -1) {
                        _warnings[i].levels.push(warning_level);
                    }
                }
            };

        }
    }

}]);