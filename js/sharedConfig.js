/**
 * URL for the IPA API server ("the backend")
 */
var serverRoot = 'http://localhost:8080'

/**
 * URL and token for DW server
 */
var dwUrl = 'https://beta.dw.dss.ucdavis.edu'
var dwToken = 'dssit';


sharedApp.config(function($provide) {
	$provide.decorator("$exceptionHandler", function($delegate, $injector) {
		return function(exception, cause) {
			$delegate(exception, cause);

			var $http = $injector.get("$http");
			var $location = $injector.get("$location");
			var $rootScope = $injector.get("$rootScope");
			$rootScope.errorsSent = $rootScope.errorsSent || [];

			// Make sure an error is sent only once
			if ($rootScope.errorsSent.indexOf(exception.message) < 0) {
				$rootScope.errorsSent.push(exception.message);
				var exceptionObject = {
						message: exception.message,
						stack: exception.stack,
						url: $location.absUrl()
				};
				
				$http.defaults.headers.common.Authorization = 'Bearer ' + localStorage.getItem("JWT"); // Set proper headers
				$http.post(serverRoot + "/api/reportJsException", exceptionObject, { withCredentials: true }).then(function(res) {
					return res.data;
				});
			}
		};
	});
});

var slowConnectionInterceptor = function ($q, $timeout, $rootScope) {
	var reqCount = 0;
	return {
		request: function(config) {
			reqCount++;
			if ($rootScope.responseTimer) {
				$timeout.cancel($rootScope.responseTimer);
			}
			$rootScope.responseTimer = $timeout( function() {
				$rootScope.slowResponse = true;
			}, 6000);

			return config;
		},
		response: function(response) {
			if (--reqCount === 0) {
				$timeout.cancel($rootScope.responseTimer);
				$rootScope.slowResponse = false;
			}

			return response;
		},
		responseError: function(rejection) {
			if (--reqCount === 0) {
				$timeout.cancel($rootScope.responseTimer);
				$rootScope.slowResponse = false;
			}

			// Redirect 'Access Denied' responses to /accessDenied
			if (rejection.status === 403) {
				$rootScope.loadingError = 403;
			}

			return $q.reject(rejection);
		}
	}
};

var tokenValidatorInterceptor = function ($q, $injector, $rootScope) {
	return {
		responseError: function(rejection) {
			if (rejection.status === 440) {
				// Delete expired token and revalidate
				localStorage.removeItem('JWT');
				var authService = $injector.get('authService');
				authService.validate().then(function(){
					// $rootScope.toast.message = "This is inconcieveable";
					$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
				});
			}

			return $q.reject(rejection);
		}
	}
};

sharedApp
	// Intercept Ajax traffic
	.config(function($httpProvider) {
		$httpProvider.interceptors.push(slowConnectionInterceptor);
		$httpProvider.interceptors.push(tokenValidatorInterceptor);
	});
