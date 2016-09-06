window.schedulingApp = angular.module("schedulingApp", ["sharedApp", "ngRoute"]);

schedulingApp.config(function ($routeProvider) {
	return $routeProvider
		.when("/:workgroupId/:year/:termCode", {
			templateUrl: "SchedulingCtrl.html",
			controller: "SchedulingCtrl",
			resolve: {
				payload: SchedulingCtrl.getPayload
			}
		})
		.when("/:workgroupId/:year", {
			templateUrl: "not-found.html"
		})
		.when("/", {
			templateUrl: "SchedulingCtrl.html",
			controller: "SchedulingCtrl",
			resolve: {
				payload: SchedulingCtrl.getPayload
			}
		})
		.otherwise({
			redirectTo: "/"
		});
});

var INIT_STATE = "INIT_STATE";
var SECTION_GROUP_SELECTED = "SECTION_GROUP_SELECTED";
var FETCH_SECTION_GROUP_DETAILS = "FETCH_SECTION_GROUP_DETAILS";
var SECTION_GROUP_TOGGLED = "SECTION_GROUP_TOGGLED";
var ACTIVITY_SELECTED = "ACTIVITY_SELECTED";
var TOGGLE_DAY = "TOGGLE_DAY";
var UPDATE_TAG_FILTERS = "UPDATE_TAG_FILTERS";
var UPDATE_ACTIVITY = "UPDATE_ACTIVITY";
var REMOVE_ACTIVITY = "REMOVE_ACTIVITY";
var CREATE_SHARED_ACTIVITY = "CREATE_SHARED_ACTIVITY";
var CREATE_ACTIVITY = "CREATE_ACTIVITY";

'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:SchedulingCtrl
 * @description
 * # SchedulingCtrl
 * Controller of the ipaClientAngularApp
 */
schedulingApp.controller('SchedulingCtrl', ['$scope', '$rootScope', '$routeParams', 'Activity', 'Term', 'schedulingActionCreators',
		this.SchedulingCtrl = function ($scope, $rootScope, $routeParams, Activity, Term, schedulingActionCreators) {
			$scope.workgroupId = $routeParams.workgroupId;
			$scope.year = $routeParams.year;
			$scope.termCode = $routeParams.termCode;
			$scope.term = Term.prototype.getTermByTermCode($scope.termCode);
			$scope.view = {};

			$scope.days = ['M','T','W','R','F','S','U'];
			$scope.standardPatterns = Activity.prototype.getStandardTimes();

			$rootScope.$on('schedulingStateChanged', function (event, data) {
				$scope.view.state = data.state;
			});

			$scope.setSelectedSectionGroup = function (sectionGroupId) {
				var sectionGroup = $scope.view.state.sectionGroups.list[sectionGroupId];
				schedulingActionCreators.setSelectedSectionGroup(sectionGroup);
				$scope.getSectionGroupDetails(sectionGroupId);
			};

			$scope.toggleCheckedSectionGroup = function (sectionGroupId) {
				schedulingActionCreators.toggleCheckedSectionGroup(sectionGroupId);
				$scope.getSectionGroupDetails(sectionGroupId);
			};

			$scope.setSelectedActivity = function (activityId) {
				var activity = $scope.view.state.activities.list[activityId];
				schedulingActionCreators.setSelectedActivity(activity);
			};

			$scope.getSectionGroupDetails = function (sectionGroupId) {
				var sectionGroup = $scope.view.state.sectionGroups.list[sectionGroupId];

				// Initialize sectionGroup sections if not done already
				if (sectionGroup && sectionGroup.sectionIds == undefined) {
					schedulingActionCreators.getSectionGroupDetails(sectionGroup);
				}
			};

			$scope.getWeekDays = function(dayIndicator, dayIndicators) {
				var dayArr = dayIndicator.split('');

				var dayStr = '';
				angular.forEach(dayArr, function(day, i) {
					if (day === '1') dayStr = dayStr + $scope.days[i];
				});

				return dayStr;
			};

			$scope.getMeridianTime = function (time) {
				var time = Activity.prototype.getMeridianTime(time);
				return ('0' + time.hours).slice(-2) + ':' + ('0' + time.minutes).slice(-2) + ' ' + time.meridian;
			};

			$scope.toggleCalendarDay = function (index) {
				schedulingActionCreators.toggleDay(index);
			};

			$scope.toggleTagFilter = function (tagId) {
				var tagFilters = $scope.view.state.filters.enabledTagIds;
				var tagIndex = tagFilters.indexOf(tagId);

				if (tagIndex < 0) {
					tagFilters.push(tagId);
				} else {
					tagFilters.splice(tagIndex, 1);
				}

				schedulingActionCreators.updateTagFilters(tagFilters);
			};

			$scope.clearLocation = function () {
				var activity = $scope.view.state.activities.list[$scope.view.state.uiState.selectedActivityId];
				activity.locationId = 0;
				$scope.saveActivity();
			};

			$scope.toggleActivityDay = function(index) {
				var activity = $scope.view.state.activities.list[$scope.view.state.uiState.selectedActivityId];
				var dayArr = activity.dayIndicator.split('');
				dayArr[index] = Math.abs(1 - parseInt(dayArr[index])).toString();
				activity.dayIndicator = dayArr.join('');
				$scope.saveActivity();
			};

			$scope.setActivityStandardTime = function (time) {
				var activity = $scope.view.state.activities.list[$scope.view.state.uiState.selectedActivityId];
				activity.frequency = 1;
				activity.startTime = time.start;
				activity.endTime = time.end;
				$scope.saveActivity();
			};

			$scope.saveActivity = function () {
				var activity = $scope.view.state.activities.list[$scope.view.state.uiState.selectedActivityId];
				schedulingActionCreators.updateActivity(activity);
			};

			$scope.removeActivity = function (activity) {
				schedulingActionCreators.removeActivity(activity);
			};

			$scope.createSharedActivity = function (sharedActivity, sectionGroup) {
				schedulingActionCreators.createSharedActivity(sharedActivity, sectionGroup);
			};

			$scope.createActivity = function (activity, sectionGroup) {
				schedulingActionCreators.createActivity(activity, sectionGroup);
			};
		}
]);

SchedulingCtrl.getPayload = function (authService, $route, schedulingActionCreators) {
	authService.validate(localStorage.getItem('JWT'), $route.current.params.workgroupId, $route.current.params.year).then(function () {
		return schedulingActionCreators.getInitialState($route.current.params.workgroupId, $route.current.params.year, $route.current.params.termCode);
	});
}

schedulingApp.directive("termCalendar", this.termCalendar = function ($rootScope, $timeout, schedulingActionCreators) {
	return {
		restrict: 'E',
		template: '<div id="calendar"></div>',
		replace: true,
		link: function (scope, element, attrs) {
			scope.view = {};

			var refreshCalendar = function () {
				var parentAspectRatio = element.parent().width() / element.parent().height();
				element.fullCalendar('destroy');
				element.fullCalendar({
					defaultView: 'agendaWeek',
					allDaySlot: false,
					allDayDefault: false,
					aspectRatio: parentAspectRatio,
					height: "auto",
					minTime: '06:00',
					maxTime: '18:00',
					header: false,
					slotEventOverlap: false,
					hiddenDays: scope.view.state.filters.hiddenDays,
					eventSources: [
						// TODO: Add instructor unavailabilities,
						getActivities()
					],
					eventClick: function (calEvent, jsEvent, view) {
						var activity = scope.view.state.activities.list[calEvent.activityId];
						schedulingActionCreators.setSelectedActivity(activity);
						// Important: notify angular since this happends outside of the scope
						scope.$apply();
					}
				});
			};

			var getActivities = function () {
				// Each of these If blocks will add to a 'events array'
				// The event making function will color them appropriately
				var calendarActivities = [];

				// Add Selected sectionGroup activities
				if (scope.view.state.uiState.selectedSectionGroupId) {
					calendarActivities = calendarActivities.concat(
						createCalendarEvents(scope.view.state.sectionGroups.list[scope.view.state.uiState.selectedSectionGroupId], null)
					);
				}

				// Add checked sectionGroups activities
				if (scope.view.state.uiState.checkedSectionGroupIds.length > 0) {
					scope.view.state.uiState.checkedSectionGroupIds.forEach(function (sgId) {
						if (sgId !== scope.view.state.uiState.selectedSectionGroupId) {
							calendarActivities = calendarActivities.concat(
								createCalendarEvents(scope.view.state.sectionGroups.list[sgId], "#006600")
							);
						}
					});
				}

				return calendarActivities;
			};

			var activityToEvents = function (activity, title) {
				var calendarActivities = [];
				if (activity.startTime && activity.endTime) {
					var dayArray = activity.dayIndicator.split('');

					var start = activity.startTime.split(':').map(Number);
					var end = activity.endTime.split(':').map(Number);

					dayArray.forEach(function(d,i) {
						if (d === '1') {
							var activityStart = moment().day(i).hour(start[0]).minute(start[1]).second(0).format('llll');
							var activityEnd = moment().day(i).hour(end[0]).minute(end[1]).second(0).format('llll');

							calendarActivities.push({
								title: title,
								start: activityStart,
								end: activityEnd,
								activityId: activity.id
							});
						}
					});
				}
				return calendarActivities;
			};

			var sectionGroupToEvents = function (sectionGroup) {
				var calendarActivities = [];
				var title = getCourseTitleByCourseId(sectionGroup.courseId);

				if (sectionGroup.sharedActivityIds) {
					sectionGroup.sharedActivityIds.forEach(function (sharedActivityId) {
						calendarActivities = calendarActivities.concat(activityToEvents(scope.view.state.activities.list[sharedActivityId], title));
					});
				}
				if (sectionGroup.sectionIds) {
					sectionGroup.sectionIds.forEach(function (sectionId) {
						var section = scope.view.state.sections.list[sectionId];
						if (section.activityIds) {
							section.activityIds.forEach(function (activityId) {
								calendarActivities = calendarActivities.concat(activityToEvents(scope.view.state.activities.list[activityId], title));
							});
						}
					});
				}

				return calendarActivities;
			};

			var createCalendarEvents = function (sectionGroup, color) {
				var hiliteColor = "#303641"
				var calendarActivities = sectionGroupToEvents(sectionGroup);
				calendarActivities.forEach(function (event) {
					event.color = (scope.view.state.uiState.selectedActivityId === event.activityId) ? hiliteColor : color;
				});
				return calendarActivities;
			};

			var getCourseTitleByCourseId = function (courseId) {
				var course = scope.view.state.courses.list[courseId];
				return course.subjectCode + " " + course.courseNumber + " - " + course.sequencePattern;
			};

			$rootScope.$on("schedulingStateChanged", function (event, data) {
				scope.view.state = data.state;
				refreshCalendar();
			});

			var neonCalendar = neonCalendar || {};

			neonCalendar.$container = $(".calendar-env");

			$.extend(neonCalendar, {
				isPresent: neonCalendar.$container.length > 0
			});

		}
	}
});

/**
 * example:
 * <time-input	time="time"
 * 				minute-step="5"
 *				on-change-delay="500"
 *				on-change="saveChanges()"
 * 				link-minute-hour="true"></time-input>
 */
schedulingApp.directive("timeInput", this.timeInput = function($timeout) {
	return {
		restrict: "E",
		templateUrl: 'timeInput.html',
		scope: {
			time: '=',
			minuteStep: '@',
			onChangeDelay: '@',
			onChange: '&'
		},
		link: function(scope, element, attrs) {
			var linkMinuteHour = (attrs.linkMinuteHour === 'true');

			scope.getMeridianTime = function() {
				if (!scope.time) {
					return {hours: '--', minutes: '--', meridian: '--'};
				}

				var timeArr = scope.time.split(':');

				var hours = parseInt(timeArr[0]);
				if (hours === 0) hours = 12;
				else if (hours > 12) hours = hours % 12;

				var minutes = parseInt(timeArr[1]);
				var meridian = timeArr[0] < 12 ? 'AM' : 'PM';

				return {hours: hours, minutes: minutes, meridian: meridian};
			};

			scope.incrementHours = function() {
				var time = scope.getMeridianTime();

				var hours;
				if (time.hours === '--') {
					hours = 12;
					time.minutes = 0;
					time.meridian = 'PM';
				} else {
					hours = time.hours;
				}

				hours++;
				if (hours === 12) {
					time.hours = hours;
					time.meridian = time.meridian === 'AM' ? 'PM' : 'AM';
				} else if (hours > 12) {
					time.hours = hours % 12;
				} else {
					time.hours = hours;
				}
				scope.updateTime(time);
			};

			scope.decrementHours = function() {
				var time = scope.getMeridianTime();

				var hours;
				if (time.hours === '--') {
					hours = 12;
					time.minutes = 0;
					time.meridian = 'PM';
				} else {
					hours = time.hours;
				}

				hours--;
				if (hours === 0) {
					time.hours = 12;
				} else if (hours === 11) {
					time.hours = hours;
					time.meridian = time.meridian === 'AM' ? 'PM' : 'AM';
				} else {
					time.hours = hours;
				}
				scope.updateTime(time);
			};

			scope.incrementMinutes = function() {
				var time = scope.getMeridianTime();

				var minutes;
				if (time.minutes === '--') {
					minutes = 0;
					time.hours = 12;
					time.meridian = 'PM';
				} else {
					minutes = time.minutes;
				}

				minutes += parseInt(scope.minuteStep);
				if (minutes >= 60) {
					time.minutes = minutes % 60;
					scope.updateTime(time);
					if (linkMinuteHour) { scope.incrementHours(); }
				} else {
					time.minutes = minutes;
					scope.updateTime(time);
				}
			};

			scope.decrementMinutes = function() {
				var time = scope.getMeridianTime();

				var minutes;
				if (time.minutes === '--') {
					minutes = 0;
					time.hours = 12;
					time.meridian = 'PM';
				} else {
					minutes = time.minutes;
				}

				minutes -= parseInt(scope.minuteStep);
				if (minutes < 0) {
					time.minutes = minutes + 60;
					scope.updateTime(time);
					if (linkMinuteHour) { scope.decrementHours(); }
				} else {
					time.minutes = minutes;
					scope.updateTime(time);
				}
			};

			scope.toggleMeridian = function() {
				var time = scope.getMeridianTime();
				if (time.meridian === 'AM') {
					time.meridian = 'PM';
				} else if (time.meridian === 'PM') {
					time.meridian = 'AM';
				} else {
					time.minutes = 0;
					time.hours = 12;
					time.meridian = 'PM';
				}
				scope.updateTime(time);
			};

			scope.updateTime = function(time) {
				if (time.meridian === 'PM' && time.hours !== 12) time.hours = time.hours + 12;
				else if (time.meridian === 'AM' && time.hours === 12) time.hours = 0;

				scope.time = ('0' + time.hours).slice(-2) + ':' + ('0' + time.minutes).slice(-2) + ":00";

				$timeout(function () {
					scope.onChange();
				}, parseInt(scope.onChangeDelay));
			}
		}
	}
});

'use strict';

/**
 * @ngdoc service
 schedulingApp.schedulingActionCreators
 * @description
 * # schedulingActionCreators
 schedulingApp.
 * Central location for sharedState information.
 */
schedulingApp.service('schedulingActionCreators', function (schedulingStateService, schedulingService, $rootScope, Role) {
	return {
		getInitialState: function (workgroupId, year, termCode) {
			schedulingService.getScheduleByWorkgroupIdAndYearAndTermCode(workgroupId, year, termCode).then(function (payload) {
				var action = {
					type: INIT_STATE,
					payload: payload
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateActivity: function (activity) {
			schedulingService.updateActivity(activity).then(function (updatedActivity) {
				$rootScope.$emit('toast', {message: "Updated " + activity.getCodeDescription(), type: "SUCCESS"});
				var action = {
					type: UPDATE_ACTIVITY,
					payload: {
						activity: updatedActivity
					}
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeActivity: function (activity) {
			schedulingService.removeActivity(activity.id).then(function () {
				$rootScope.$emit('toast', {message: "Removed " + activity.getCodeDescription(), type: "SUCCESS"});
				var action = {
					type: REMOVE_ACTIVITY,
					payload: {
						activity: activity
					}
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		createSharedActivity: function (activity, sectionGroup) {
			schedulingService.createSharedActivity(activity).then(function (newActivity) {
				$rootScope.$emit('toast', {message: "Created new shared " + activity.getCodeDescription(), type: "SUCCESS"});
				var action = {
					type: CREATE_SHARED_ACTIVITY,
					payload: {
						activity: newActivity,
						sectionGroup: sectionGroup
					}
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		createActivity: function (activity, sectionGroup) {
			schedulingService.createActivity(activity).then(function (newActivity) {
				$rootScope.$emit('toast', {message: "Created new " + activity.getCodeDescription(), type: "SUCCESS"});
				var action = {
					type: CREATE_ACTIVITY,
					payload: {
						activity: newActivity,
						sectionGroup: sectionGroup
					}
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		setSelectedSectionGroup: function (sectionGroup) {
			var action = {
				type: SECTION_GROUP_SELECTED,
				payload: {
					sectionGroup: sectionGroup
				}
			};
			schedulingStateService.reduce(action);
		},
		toggleCheckedSectionGroup: function (sectionGroupId) {
			var action = {
				type: SECTION_GROUP_TOGGLED,
				payload: {
					sectionGroupId: sectionGroupId
				}
			};
			schedulingStateService.reduce(action);
		},
		setSelectedActivity: function (activity) {
			var action = {
				type: ACTIVITY_SELECTED,
				payload: {
					activity: activity
				}
			};
			schedulingStateService.reduce(action);
		},
		getSectionGroupDetails: function (sectionGroup) {
			schedulingService.getSectionSectionGroupDetails(sectionGroup.id).then(function (payload) {
				var action = {
					type: FETCH_SECTION_GROUP_DETAILS,
					payload: {
						sectionGroup: sectionGroup,
						sections: payload.sections,
						sharedActivities: payload.sharedActivities,
						unsharedActivities: payload.unsharedActivities
					}
				};
				schedulingStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', { message: "Something went wrong. Please try again.", type: "ERROR"} );
			});
		},
		toggleDay: function (dayIndex) {
			var action = {
				type: TOGGLE_DAY,
				payload: {
					dayIndex: dayIndex
				}
			};
			schedulingStateService.reduce(action);
		},
		updateTagFilters: function (tagIds) {
			var action = {
				type: UPDATE_TAG_FILTERS,
				payload: {
					tagIds: tagIds
				}
			};
			schedulingStateService.reduce(action);
		}
	}
});

'use strict';

/**
 * @ngdoc service
 * @name schedulingApp.schedulingService
 * @description
 * # schedulingService
 * Service in the schedulingApp.
 * schedulingApp specific api calls.
 */
schedulingApp.factory("schedulingService", this.schedulingService = function($http, $q) {
	return {
		getScheduleByWorkgroupIdAndYearAndTermCode: function (workgroupId, year, termCode) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/schedulingView/workgroups/" + workgroupId + "/years/" + year + "/termCode/" + termCode, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		getSectionSectionGroupDetails: function (sectionGroupId) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/schedulingView/sectionGroups/" + sectionGroupId, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateActivity: function (activity) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/schedulingView/activities/" + activity.id, activity, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removeActivity: function (activityId) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/schedulingView/activities/" + activityId, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		createSharedActivity: function (activity) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/schedulingView/sectionGroups/" + activity.sectionGroupId, activity, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		createActivity: function (activity) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/schedulingView/sections/" + activity.sectionId, activity, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
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
 schedulingApp.schedulingStateService
 * @description
 * # schedulingStateService
 schedulingApp.
 * Central location for sharedState information.
 */
schedulingApp.service('schedulingStateService', function ($rootScope, Course, SectionGroup, Section, Activity, Tag, Location) {
	return {
		_state: {},
		_courseReducers: function (action, courses) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					courses = {
						newCourse: null,
						ids: []
					};
					var coursesList = {};
					var length = action.payload.courses ? action.payload.courses.length : 0;
					for (var i = 0; i < length; i++) {
						var courseData = action.payload.courses[i];
						coursesList[courseData.id] = new Course(courseData);
					}
					courses.ids = _array_sortIdsByProperty(coursesList, ["subjectCode", "courseNumber", "sequencePattern"]);
					courses.list = coursesList;
					return courses;
				case UPDATE_TAG_FILTERS:
					// Set the course.matchesTagFilters flag to true if any tag matches the filters
					courses.ids.forEach(function (courseId) {
						courses.list[courseId].matchesTagFilters = courses.list[courseId].tagIds
							.some(function (tagId) {
								return action.payload.tagIds.indexOf(tagId) >= 0;
							});
					});
					return courses;
				default:
					return courses;
			}
		},
		_sectionGroupReducers: function (action, sectionGroups) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					sectionGroups = {
						newSectionGroup: {},
						ids: []
					};
					var sectionGroupsList = {};
					var length = action.payload.sectionGroups ? action.payload.sectionGroups.length : 0;
					for (var i = 0; i < length; i++) {
						var sectionGroupData = action.payload.sectionGroups[i];
						sectionGroupsList[sectionGroupData.id] = new SectionGroup(sectionGroupData);
						sectionGroups.ids.push(sectionGroupData.id);
					}
					sectionGroups.list = sectionGroupsList;
					return sectionGroups;
				case FETCH_SECTION_GROUP_DETAILS:
					sectionGroups.list[action.payload.sectionGroup.id].sectionIds = action.payload.sections
						.sort(function (sectionA, sectionB) {
							if (sectionA.sequenceNumber < sectionB.sequenceNumber) { return -1; }
							if (sectionA.sequenceNumber > sectionB.sequenceNumber) { return 1; }
							return 0;
 						})
						.map(function (section) { return section.id; });
					sectionGroups.list[action.payload.sectionGroup.id].sharedActivityIds = action.payload.sharedActivities
						.map(function (a) { return a.id; });
					return sectionGroups;
				case REMOVE_ACTIVITY:
					var sectionGroup = sectionGroups.list[action.payload.activity.sectionGroupId];
					if (!sectionGroup.sharedActivityIds) { return sectionGroups; }

					var activityIndex = sectionGroup.sharedActivityIds.indexOf(action.payload.activity.id);
					if (activityIndex >= 0) {
						sectionGroup.sharedActivityIds.splice(activityIndex, 1);
					}
					return sectionGroups;
				case CREATE_SHARED_ACTIVITY:
					sectionGroups.list[action.payload.sectionGroup.id].sharedActivityIds.push(action.payload.activity.id);
					return sectionGroups;
				default:
					return sectionGroups;
			}
		},
		_sectionReducers: function (action, sections) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					sections = {
						list: {},
						ids: []
					};
					return sections;
				case FETCH_SECTION_GROUP_DETAILS:
					action.payload.sections.forEach(function (section) {
						section.activityIds = action.payload.unsharedActivities
							.filter(function (a) { return a.sectionId == section.id; })
							.map(function (a) { return a.id; });
						sections.list[section.id] = new Section(section);
						sections.ids.push(section.id);
					});
					return sections;
				case REMOVE_ACTIVITY:
					var section = sections.list[action.payload.activity.sectionId];
					var activityIndex = section.activityIds.indexOf(action.payload.activity.id);
					if (activityIndex >= 0) {
						section.activityIds.splice(activityIndex, 1);
					}
					return sections;
				case CREATE_ACTIVITY:
					sections.list[action.payload.activity.sectionId].activityIds.push(action.payload.activity.id);
					return sections;
				default:
					return sections;
			}
		},
		_activityReducers: function (action, activities) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					activities = {
						list: {},
						ids: []
					};
					return activities;
				case FETCH_SECTION_GROUP_DETAILS:
					action.payload.sharedActivities.forEach(function (activity) {
						activities.list[activity.id] = new Activity(activity);
						activities.list[activity.id].courseId = action.payload.sectionGroup.courseId;
						activities.ids.push(activity.id);
					});
					action.payload.unsharedActivities.forEach(function (activity) {
						activities.list[activity.id] = new Activity(activity);
						activities.list[activity.id].courseId = action.payload.sectionGroup.courseId;
						activities.ids.push(activity.id);
					});
					return activities;
				case UPDATE_ACTIVITY:
					activities.list[action.payload.activity.id] = new Activity(action.payload.activity);
					return activities;
				case REMOVE_ACTIVITY:
					var activityIndex = activities.ids.indexOf(action.payload.activity.id);
					activities.ids.splice(activityIndex, 1);
					delete activities.list[action.payload.activity.id];
					return activities;
				case CREATE_SHARED_ACTIVITY:
				case CREATE_ACTIVITY:
					activities.list[action.payload.activity.id] = new Activity(action.payload.activity);
					activities.list[action.payload.activity.id].courseId = action.payload.sectionGroup.courseId;
					activities.ids.push(action.payload.activity.id);
					return activities;
				default:
					return activities;
			}
		},
		_tagReducers: function (action, tags) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					tags = {
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
				default:
					return tags;
			}
		},
		_locationReducers: function (action, locations) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					locations = {
						list: {},
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
				default:
					return locations;
			}
		},
		_filterReducers: function (action, filters) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					// A filter is 'enabled' if it is checked, i.e. the category it represents
					// is selected to be shown/on/active.
					filters = {
						enabledTagIds: [],
						hiddenDays: [0, 6], // Default hidden days: Sat and Sun
						enableUnpublishedCourses: false
					};
					// Here is where we might load stored data about what filters
					// were left on last time.
					return filters;
				case TOGGLE_DAY:
					var tagIndex = filters.hiddenDays.indexOf(action.payload.dayIndex);
					if (tagIndex >= 0) {
						filters.hiddenDays.splice(tagIndex, 1);
					} else if (filters.hiddenDays.length < 6) { // Make sure not to hide all days
						filters.hiddenDays.push(action.payload.dayIndex);
					}
					return filters;
				case UPDATE_TAG_FILTERS:
					filters.enabledTagIds = action.payload.tagIds;
					return filters;
				default:
					return filters;
			}
		},
		_uiStateReducers: function (action, uiState) {
			var scope = this;

			switch (action.type) {
				case INIT_STATE:
					uiState = {
						selectedSectionGroupId: null,
						selectedCourseId: null,
						selectedActivityId: null,
						checkedSectionGroupIds: []
					};
					return uiState;
				case SECTION_GROUP_SELECTED:
					uiState.selectedActivityId = null;
					if (uiState.selectedSectionGroupId != action.payload.sectionGroup.id) {
						uiState.selectedSectionGroupId = action.payload.sectionGroup.id;
						uiState.selectedCourseId = action.payload.sectionGroup.courseId;
					} else {
						uiState.selectedSectionGroupId = null;
						uiState.selectedCourseId = null;
					}
					return uiState;
				case SECTION_GROUP_TOGGLED:
					var sectionGroupCheckedIndex = uiState.checkedSectionGroupIds.indexOf(action.payload.sectionGroupId);
					if (sectionGroupCheckedIndex < 0) {
						uiState.checkedSectionGroupIds.push(action.payload.sectionGroupId);
					} else {
						uiState.checkedSectionGroupIds.splice(sectionGroupCheckedIndex, 1);
					}
					return uiState;
				case ACTIVITY_SELECTED:
					if (uiState.selectedActivityId != action.payload.activity.id) {
						uiState.selectedActivityId = action.payload.activity.id;
						uiState.selectedSectionGroupId = action.payload.activity.sectionGroupId;
						uiState.selectedCourseId = action.payload.activity.courseId;
					} else {
						uiState.selectedActivityId = null;
					}
					return uiState;
				case UPDATE_TAG_FILTERS:
					// TODO: needs re-visiting, ultimately this should clear
					// checkedSectionGroupIds, selectedSectionGroupId, selectedCourseId,
					// and selectedActivityId ONLY if they don't match the filters
					uiState.selectedSectionGroupId = null;
					uiState.selectedCourseId = null;
					uiState.selectedActivityId = null;
					uiState.checkedSectionGroupIds = [];
					return uiState;
				case REMOVE_ACTIVITY:
					if (uiState.selectedActivityId == action.payload.activity.id) {
						uiState.selectedActivityId = null;
					}
					return uiState;
				default:
					return uiState;
			}
		},
		reduce: function (action) {
			var scope = this;

			if (!action || !action.type) {
				return;
			}

			newState = {};
			newState.courses = scope._courseReducers(action, scope._state.courses);
			newState.sectionGroups = scope._sectionGroupReducers(action, scope._state.sectionGroups);
			newState.sections = scope._sectionReducers(action, scope._state.sections);
			newState.activities = scope._activityReducers(action, scope._state.activities);
			newState.tags = scope._tagReducers(action, scope._state.tags);
			newState.locations = scope._locationReducers(action, scope._state.locations);
			newState.filters = scope._filterReducers(action, scope._state.filters);
			newState.uiState = scope._uiStateReducers(action, scope._state.uiState);

			scope._state = newState;
			$rootScope.$emit('schedulingStateChanged', {
				state: scope._state,
				actionType: action.type
			});

			console.debug("Scheduling state updated:");
			console.debug(scope._state);
		}
	}
});
