(function () {


var app = angular.module('app', [
      'angularMoment',
    , 'angular-storage'
    , 'ui.bootstrap'
    ]);

app.service('authService',
    ['$window', 'moment', 'store',
    function($window, moment, store) {
        var self = this;
        this.setAuthInfo = function(username, token, expiresIn) {
            store.set('authInfo', {
                username: username,
                bearerToken: token,
                validUntil: moment.utc().add(expiresIn, 's').format()
            });
        };
        this.getAuthInfo = function() {
            return store.get('authInfo');
        };
        this.isAuthenticated = function() {
            var auth = self.getAuthInfo();
            return auth && moment.utc().isBefore(auth.validUntil);
        };
        this.deleteAuthInfo = function() {
            store.remove('authInfo');
        };
}]);

app.factory('authIntercept', ['authService', function(authService) {
    return {
        request: function(config) {
            var auth = authService.getAuthInfo();
            if (auth && config.url.indexOf('/api/') === 0 &&
                authService.isAuthenticated()) {
                config.headers['x-access-token'] = auth.bearerToken;
            }
            return config;
        }
    };
}]);

app.config(['$httpProvider', 
    function($httpProvider) {
        $httpProvider.interceptors.push('authIntercept');

}]);


app.controller('MainController',
	['$scope', '$http', '$window', 'authService',
	function($scope, $http, $window, authService) {

        $scope.authData = {
            username: null,
            email: null,
            password: null
        };

        if(authService.isAuthenticated())
            $scope.username = authService.getAuthInfo().username;

        $scope.isAuthenticated = function() {
            return authService.isAuthenticated();
        };

		$scope.authenticate = function()
		{
			$http.post('/authenticate', {
				name: $scope.authData.username,
				password: $scope.authData.password
			})
			.then(function (res) {
				if (res.data.success) {
					console.log('Auth succeeded');
                    authService.setAuthInfo(
                        $scope.authData.username, res.data.token,
                        res.data.expiresIn);

				} else {
					console.log('Auth failed');
				}
			}, function(errRes) {				
			});
		};

        $scope.logout = function() {
            authService.deleteAuthInfo();
        };

		$scope.signup = function()
		{
            $http.post('/signup', {
                name: $scope.authData.username,
                email: $scope.authData.email,
                password: $scope.authData.password
            })
            .then(function(res) {
                console.log(res.data);
            }, function(errRes) {
                console.log(errRes.data);
            });
		};

        $scope.doSomething = function()
        {
            $http.get('/api/')
                 .then(function(res) {
                    console.log(res.data);                   
                 }, function(res) {
                    console.log(res.data);
                 });
        };

	}]);


})();
