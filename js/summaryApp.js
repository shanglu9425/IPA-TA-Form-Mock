window.summaryApp = angular.module("summaryApp", ["sharedApp", "ngRoute"]);

summaryApp.config(function ($routeProvider) {
	return $routeProvider
		.when("/:workgroupId/:year", {
			templateUrl: "SummaryCtrl.html",
			controller: "SummaryCtrl",
			resolve: {
				authenticate: SummaryCtrl.authenticate
			}
		})
		.when("/", {
			templateUrl: "SummaryCtrl.html",
			controller: "SummaryCtrl",
			resolve: {
				authenticate: SummaryCtrl.authenticate
			}
		})
		.otherwise({
			redirectTo: "/"
		});
});

'use strict';

/**
 * @ngdoc function
 * @name summaryApp.controller:SummaryCtrl
 * @description
 * # SummaryCtrl
 * Controller of the summaryApp
 */
summaryApp.controller('SummaryCtrl', ['$scope', '$routeParams',
		this.SummaryCtrl = function ($scope, $routeParams) {
			$scope.workgroupId = $routeParams.workgroupId;
			$scope.year = $routeParams.year;
}]);

SummaryCtrl.authenticate = function (authService, $route) {
	return authService.validate(localStorage.getItem('JWT'), $route.current.params.workgroupId, $route.current.params.year);
}
