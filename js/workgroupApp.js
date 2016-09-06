window.workgroupApp = angular.module("workgroupApp", ["sharedApp", "ngRoute"]);

workgroupApp.config(function ($routeProvider) {
	return $routeProvider
		.when("/:workgroupId/:year", {
			templateUrl: "WorkgroupCtrl.html",
			controller: "WorkgroupCtrl",
			resolve: {
				payload: WorkgroupCtrl.getPayload
			}
		})
		.when("/", {
			templateUrl: "WorkgroupCtrl.html",
			controller: "WorkgroupCtrl",
			resolve: {
				payload: WorkgroupCtrl.getPayload
			}
		})
		.otherwise({
			redirectTo: "/"
		});
});

var ADD_TAG = "ADD_TAG";
var REMOVE_TAG = "REMOVE_TAG";
var UPDATE_TAG = "UPDATE_TAG";
var ADD_LOCATION = "ADD_LOCATION";
var REMOVE_LOCATION = "REMOVE_LOCATION";
var UPDATE_LOCATION = "UPDATE_LOCATION";
var ADD_USER = "ADD_USER";
var REMOVE_USER = "REMOVE_USER";
var ADD_USER_ROLE = "ADD_USER_ROLE";
var REMOVE_USER_ROLE = "REMOVE_USER_ROLE";
var INIT_WORKGROUP = "INIT_WORKGROUP";

'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:LocationCtrl
 * @description
 * # LocationCtrl
 * Controller of the ipaClientAngularApp
 */
workgroupApp.controller('LocationCtrl', ['$scope', 'workgroupActionCreators',
		this.LocationCtrl = function ($scope, workgroupActionCreators) {
			$scope.addLocation = function () {
				workgroupActionCreators.addLocation($scope.workgroupId, $scope.view.state.locations.newLocation);
			};

			$scope.removeLocation = function (locationId) {
				workgroupActionCreators.removeLocation($scope.workgroupId, $scope.view.state.locations.list[locationId]);
			};

			$scope.updateLocation = function (location) {
				workgroupActionCreators.updateLocation($scope.workgroupId, location);
			};
	}]);
'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:TagCtrl
 * @description
 * # TagCtrl
 * Controller of the ipaClientAngularApp
 */
workgroupApp.controller('TagCtrl', ['$scope', '$rootScope', '$routeParams', 'workgroupActionCreators',
		this.TagCtrl = function ($scope, $rootScope, $routeParams, workgroupActionCreators) {

			$scope.addTag = function () {
				workgroupActionCreators.addTag($scope.workgroupId, $scope.view.state.tags.newTag);
			};

			$scope.removeTag = function (tagId) {
				workgroupActionCreators.removeTag($scope.workgroupId, $scope.view.state.tags.list[tagId]);
			};

			$scope.updateTag = function (tag) {
				workgroupActionCreators.updateTag($scope.workgroupId, tag);
			};

	}]);
'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the ipaClientAngularApp
 */
workgroupApp.controller('UserCtrl', ['$scope', '$rootScope', '$routeParams', '$timeout', 'workgroupActionCreators', 'workgroupService',
		this.UserCtrl = function ($scope, $rootScope, $routeParams, $timeout, workgroupActionCreators, workgroupService) {
			$scope.toggleUserRole = function (userId, roleId) {
				var user = $scope.view.state.users.list[userId];
				var role = $scope.view.state.roles.list[roleId];

				if ($scope.userHasRole(userId, role)) {
					var userRoleNames = user.userRoles.map(function (userRole) { return userRole.role; });
					var userRoleIndex = userRoleNames.indexOf(role.name);
					var userRoleToBeDeleted = user.userRoles[userRoleIndex];
					workgroupActionCreators.removeRoleFromUser($scope.workgroupId, user, role, userRoleToBeDeleted);
				} else {
					workgroupActionCreators.addRoleToUser($scope.workgroupId, user, role);
				}
			};

			$scope.userHasRole = function (userId, role) {
				var user = $scope.view.state.users.list[userId];
				var userRoleNames = user.userRoles.map(function (userRole) { return userRole.role; });
				var result = userRoleNames.indexOf(role.name) > -1;
				return result;
			};

			$scope.searchUsersResultSelected = function ($item, $model, $label, $event) {
				$scope.view.state.users.newUser = $item;
			};

			$scope.clearUserSearch = function () {
				$scope.view.state.users.newUser = {};
				$scope.view.searchQuery = "";
				$scope.view.noResults = null;
			};

			$scope.searchUsers = function (query) {
				return workgroupService.searchUsers($scope.workgroupId, query).then(function (userSearchResults) {
					return userSearchResults;
				}, function (err) {
					$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
				});
			};

			$scope.addUserToWorkgroup = function() {
				workgroupActionCreators.createUser($scope.workgroupId, $scope.view.state.users.newUser);
			};

			$scope.removeUserFromWorkgroup = function(userId) {
				var user = $scope.view.state.users.list[userId];
				workgroupActionCreators.removeUserFromWorkgroup($scope.workgroupId, user);
			};

	}]);
'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:WorkgroupCtrl
 * @description
 * # WorkgroupCtrl
 * Controller of the ipaClientAngularApp
 */
workgroupApp.controller('WorkgroupCtrl', ['$scope', '$rootScope', '$routeParams', 'workgroupActionCreators',
		this.WorkgroupCtrl = function ($scope, $rootScope, $routeParams, workgroupActionCreators) {
			$scope.workgroupId = $routeParams.workgroupId;
			$scope.year = $routeParams.year;
			$scope.view = {};

			$rootScope.$on('workgroupStateChanged', function (event, data) {
				$scope.view.state = data;
			});
	}]);

WorkgroupCtrl.getPayload = function (authService,workgroupActionCreators, $route) {
	authService.validate(localStorage.getItem('JWT'), $route.current.params.workgroupId, $route.current.params.year).then(function () {
		return workgroupActionCreators.getInitialState($route.current.params.workgroupId);
	});
}
'use strict';

/**
 * @ngdoc service
 * @name workgroupApp.workgroupActionCreators
 * @description
 * # workgroupActionCreators
 * Service in the workgroupApp.
 * Central location for sharedState information.
 */
workgroupApp.service('workgroupActionCreators', function (workgroupStateService, workgroupService, $rootScope, Role) {
	return {
		getInitialState: function (workgroupId) {
			workgroupService.getWorkgroupByCode(workgroupId).then(function (payload) {
				var action = {
					type: INIT_WORKGROUP,
					payload: payload
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addTag: function (workgroupId, tag) {
			workgroupService.addTag(workgroupId, tag).then(function (newTag) {
				$rootScope.$emit('toast', {message: "Created tag " + newTag.name, type: "SUCCESS"});
				var action = {
					type: ADD_TAG,
					payload: {
						tag: newTag
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateTag: function (workgroupId, tag) {
			workgroupService.updateTag(workgroupId, tag).then(function (newTag) {
				$rootScope.$emit('toast', {message: "Updated tag " + newTag.name, type: "SUCCESS"});
				var action = {
					type: UPDATE_TAG,
					payload: {
						tag: newTag
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeTag: function (workgroupId, tag) {
			workgroupService.removeTag(workgroupId, tag).then(function () {
				$rootScope.$emit('toast', {message: "Removed tag " + tag.name, type: "SUCCESS"});
				var action = {
					type: REMOVE_TAG,
					payload: {
						tag: tag
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addLocation: function (workgroupId, location) {
			workgroupService.addLocation(workgroupId, location).then(function (newLocation) {
				$rootScope.$emit('toast', {message: "Created location " + newLocation.description, type: "SUCCESS"});
				var action = {
					type: ADD_LOCATION,
					payload: {
						location: newLocation
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateLocation: function (workgroupId, location) {
			workgroupService.updateLocation(workgroupId, location).then(function (newLocation) {
				$rootScope.$emit('toast', {message: "Renamed location to " + newLocation.description, type: "SUCCESS"});
				var action = {
					type: UPDATE_LOCATION,
					payload: {
						location: newLocation
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeLocation: function (workgroupId, location) {
			workgroupService.removeLocation(workgroupId, location).then(function (newLocation) {
				$rootScope.$emit('toast', {message: "Removed location " + location.description, type: "SUCCESS"});
				var action = {
					type: REMOVE_LOCATION,
					payload: {
						location: location
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addRoleToUser: function (workgroupId, user, role) {
			workgroupService.addRoleToUser(workgroupId, user, role).then(function (userRole) {
				$rootScope.$emit('toast', {message: user.firstName + " " + user.lastName + " is now " + role.getDisplayName(), type: "SUCCESS"});
				var action = {
					type: ADD_USER_ROLE,
					payload: {
						user: user,
						userRole: userRole,
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeRoleFromUser: function (workgroupId, user, role, userRoleToBeDeleted) {
			workgroupService.removeRoleFromUser(workgroupId, user, role).then(function (userRole) {
				$rootScope.$emit('toast', {message: user.firstName + " " + user.lastName + " is no longer " + role.getDisplayName(), type: "SUCCESS"});
				var action = {
					type: REMOVE_USER_ROLE,
					payload: {
						user: user,
						userRole: userRoleToBeDeleted
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		clearUserSearch: function () {
			var action = {
				type: SEARCH_USERS,
				payload: {
					userSearchResults: []
				}
			};
			workgroupStateService.reduce(action);
		},
		createUser: function (workgroupId, dwUser) {
			var scope = this;
			var role = new Role({name: "senateInstructor"});

			workgroupService.createUser(workgroupId, dwUser).then(function (newUser) {
				$rootScope.$emit('toast', {message: "Added user " + newUser.firstName + " " + newUser.lastName, type: "SUCCESS"});
				var action = {
					type: ADD_USER,
					payload: {
						user: newUser
					}
				};
				workgroupStateService.reduce(action);
				scope.addRoleToUser(workgroupId, newUser, role);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeUserFromWorkgroup: function (workgroupId, user) {
			workgroupService.removeUserFromWorkgroup(workgroupId, user).then(function () {
				$rootScope.$emit('toast', {message: "Removed user " + user.firstName + " " + user.lastName, type: "SUCCESS"});
				var action = {
					type: REMOVE_USER,
					payload: {
						user: user
					}
				};
				workgroupStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		}
	}
});
'use strict';

/**
 * @ngdoc service
 * @name workgroupApp.workgroupService
 * @description
 * # workgroupService
 * Service in the workgroupApp.
 * workgroupApp specific api calls.
 */
workgroupApp.factory("workgroupService", this.workgroupService = function($http, $q) {
	return {
		getWorkgroupByCode: function(workgroupId) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/workgroupView/" + workgroupId, { withCredentials: true })
			.success(function(workgroup) {
				deferred.resolve(workgroup);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addTag: function (workgroupId, tag) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/workgroupView/" + workgroupId + "/tags", tag, { withCredentials: true })
			.success(function(tag) {
				deferred.resolve(tag);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateTag: function (workgroupId, tag) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/workgroupView/" + workgroupId + "/tags/" + tag.id, tag, { withCredentials: true })
			.success(function(tag) {
				deferred.resolve(tag);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removeTag: function(workgroupId, tag) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/workgroupView/" + workgroupId + "/tags/" + tag.id, { withCredentials: true })
			.success(function() {
				deferred.resolve();
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addLocation: function (workgroupId, location) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/workgroupView/" + workgroupId + "/locations", location, { withCredentials: true })
			.success(function(location) {
				deferred.resolve(location);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateLocation: function (workgroupId, location) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/workgroupView/" + workgroupId + "/locations/" + location.id, location, { withCredentials: true })
			.success(function(location) {
				deferred.resolve(location);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removeLocation: function(workgroupId, location) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/workgroupView/" + workgroupId + "/locations/" + location.id, { withCredentials: true })
			.success(function() {
				deferred.resolve();
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addRoleToUser: function (workgroupId, user, role) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/workgroupView/users/" + user.loginId + "/workgroups/" + workgroupId + "/roles/" + role.name, null, { withCredentials: true })
			.success(function(userRole) {
				deferred.resolve(userRole);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removeRoleFromUser: function (workgroupId, user, role) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/workgroupView/users/" + user.loginId + "/workgroups/" + workgroupId + "/roles/" + role.name, { withCredentials: true })
			.success(function() {
				deferred.resolve();
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		searchUsers: function(workgroupId, query) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/workgroupView/workgroups/" + workgroupId + "/userSearch?query=" + query, { withCredentials: true })
			.success(function(result) {
				deferred.resolve(result);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		createUser: function (workgroupId, user) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/workgroupView/workgroups/" + workgroupId + "/users", user, { withCredentials: true })
			.success(function(newUser) {
				deferred.resolve(newUser);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removeUserFromWorkgroup: function (workgroupId, user) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/workgroupView/workgroups/" + workgroupId + "/users/" + user.loginId, { withCredentials: true })
			.success(function() {
				deferred.resolve();
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		}
	};
});

'use strict';

/**
 * @ngdoc service
 * @name workgroupApp.workgroupStateService
 * @description
 * # workgroupStateService
 * Service in the workgroupApp.
 * Central location for sharedState information.
 */
workgroupApp.service('workgroupStateService', function ($rootScope, Role, Tag, Location, User, UserRole) {
	return {
		_state: {},
		_tagReducers: function (action, tags) {
			var scope = this;

			switch (action.type) {
				case INIT_WORKGROUP:
					tags = {
						newTag: {},
						ids: []
					};
					var tagsList = {};
					var length = action.payload.tags ? action.payload.tags.length : 0;
					for (var i = 0; i < length; i++) {
						var tagData = action.payload.tags[i];
						if (tagData.archived == false) {
							tagsList[tagData.id] = new Tag(tagData);
						}
					}
					tags.ids = _array_sortIdsByProperty(tagsList, "name");
					tags.list = tagsList;
					return tags;
				case ADD_TAG:
					tags.list[action.payload.tag.id] = action.payload.tag;
					tags.ids.push(action.payload.tag.id);
					tags.newTag = {};
					return tags;
				case REMOVE_TAG:
					var tagIndex = tags.ids.indexOf(action.payload.tag.id);
					tags.ids.splice(tagIndex, 1);
					delete tags.list[action.payload.tag.id];
					return tags;
				case UPDATE_TAG:
					tags.list[action.payload.tag.id] = action.payload.tag;
					return tags;
				default:
					return tags;
			}
		},
		_locationReducers: function (action, locations) {
			var scope = this;

			switch (action.type) {
				case INIT_WORKGROUP:
					locations = {
						newLocation: {},
						ids: []
					};
					var locationsList = {};
					var length = action.payload.locations ? action.payload.locations.length : 0;

					for (var i = 0; i < length; i++) {
						var locationData = action.payload.locations[i];

						if (locationData.archived == false) {
							locationsList[locationData.id] = new Location(locationData);
						}
					}
					locations.ids = _array_sortIdsByProperty(locationsList, "description");
					locations.list = locationsList;
					return locations;
				case ADD_LOCATION:
					locations.list[action.payload.location.id] = action.payload.location;
					locations.ids.push(action.payload.location.id);
					locations.newLocation = {};
					return locations;
				case REMOVE_LOCATION:
					var locationIndex = locations.ids.indexOf(action.payload.location.id);
					locations.ids.splice(locationIndex, 1);
					delete locations.list[action.payload.location.id];
					return locations;
				case UPDATE_LOCATION:
					locations.list[action.payload.location.id] = action.payload.location;
					return locations;
				default:
					return locations;
			}
		},
		_userReducers: function (action, users) {
			var scope = this;

			switch (action.type) {
				case INIT_WORKGROUP:
					users = {
						newUser: {},
						ids: [],
						userSearchResults: []
					};
					var usersList = {};
					var length = action.payload.users ? action.payload.users.length : 0;
					for (var i = 0; i < length; i++) {
						var userData = action.payload.users[i];
						usersList[userData.id] = new User(userData);
					}
					users.ids = _array_sortIdsByProperty(usersList, "name");
					users.list = usersList;
					return users;
				case ADD_USER:
					users.list[action.payload.user.id] = action.payload.user;
					users.ids.push(action.payload.user.id);
					users.newUser = {};
					users.userSearchResults = [];
					return users;
				case REMOVE_USER:
					var userIndex = users.ids.indexOf(action.payload.user.id);
					users.ids.splice(userIndex, 1);
					delete users.list[action.payload.user.id];
					return users;
				case ADD_USER_ROLE:
					users.list[action.payload.user.id].userRoles.push(action.payload.userRole);
					return users;
				case REMOVE_USER_ROLE:
					var userRoleIndex = users.list[action.payload.user.id].userRoles.indexOf(action.payload.userRole);
					users.list[action.payload.user.id].userRoles.splice(userRoleIndex, 1);
					return users;
				case SEARCH_USERS:
					users.userSearchResults = action.payload.userSearchResults;
					return users;
				default:
					return users;
			}
		},
		_roleReducers: function (action, roles) {
			var scope = this;

			switch (action.type) {
				case INIT_WORKGROUP:
					roles = {
						ids: []
					};
					var _hiddenRoles = ['admin', 'registrar'];
					var rolesList = {};
					var length = action.payload.roles ? action.payload.roles.length : 0;
					for (var i = 0; i < length; i++) {
						var roleData = action.payload.roles[i];
						if (_hiddenRoles.indexOf(roleData.name) < 0) {
							rolesList[roleData.id] = new Role(roleData);
						}
					}
					roles.ids = _array_sortIdsByProperty(rolesList, "name");
					roles.list = rolesList;
					return roles;
				default:
					return roles;
			}
		},
		reduce: function (action) {
			var scope = this;

			if (!action || !action.type) {
				return;
			}

			newState = {};
			newState.tags = scope._tagReducers(action, scope._state.tags);
			newState.locations = scope._locationReducers(action, scope._state.locations);
			newState.users = scope._userReducers(action, scope._state.users);
			newState.roles = scope._roleReducers(action, scope._state.roles);

			scope._state = newState;
			$rootScope.$emit('workgroupStateChanged',scope._state);
			console.log(scope._state);
		}
	}
});