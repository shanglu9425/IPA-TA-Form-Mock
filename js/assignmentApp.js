window.assignmentApp = angular.module("assignmentApp", ["sharedApp", "ngRoute"]);

assignmentApp.config(function ($routeProvider) {
	return $routeProvider
		.when("/:workgroupId/:year", {
			templateUrl: "AssignmentCtrl.html",
			controller: "AssignmentCtrl",
			resolve: {
				validate: AssignmentCtrl.validate
			}
		})
		.when("/:workgroupId/:year/teachingCall", {
			templateUrl: "TeachingCall.html",
			controller: "TeachingCallCtrl",
			resolve: {
				validate: TeachingCallCtrl.validate
			}
		})
		.when("/", {
			templateUrl: "AssignmentCtrl.html",
			controller: "AssignmentCtrl",
			resolve: {
				validate: AssignmentCtrl.validate
			}
		})
		.otherwise({
			redirectTo: "/"
		});
});

var INIT_ASSIGNMENT_VIEW = "INIT_ASSIGNMENT_VIEW";
var ADD_TEACHING_ASSIGNMENT = "ADD_TEACHING_ASSIGNMENT";
var UPDATE_TEACHING_ASSIGNMENT = "UPDATE_TEACHING_ASSIGNMENT";
var REMOVE_TEACHING_ASSIGNMENT = "REMOVE_TEACHING_ASSIGNMENT";
var SWITCH_MAIN_VIEW = "SWITCH_MAIN_VIEW";
var TOGGLE_TERM_FILTER = "TOGGLE_TERM_FILTER";
var UPDATE_TABLE_FILTER = "UPDATE_TABLE_FILTER";
var ADD_SCHEDULE_INSTRUCTOR_NOTE = "ADD_SCHEDULE_INSTRUCTOR_NOTE";
var UPDATE_SCHEDULE_INSTRUCTOR_NOTE = "UPDATE_SCHEDULE_INSTRUCTOR_NOTE";
var ADD_TEACHING_CALL_RESPONSE = "ADD_TEACHING_CALL_RESPONSE";
var UPDATE_TEACHING_CALL_RESPONSE = "UPDATE_TEACHING_CALL_RESPONSE";
var INIT_ACTIVE_TEACHING_CALL = "INIT_ACTIVE_TEACHING_CALL";
var ADD_PREFERENCE = "ADD_PREFERENCE";
var REMOVE_PREFERENCE = "REMOVE_PREFERENCE";
var UPDATE_TEACHING_CALL_RECEIPT = "UPDATE_TEACHING_CALL_RECEIPT";
var CREATE_TEACHING_CALL = "CREATE_TEACHING_CALL";
var UPDATE_TEACHING_ASSIGNMENT_ORDER = "UPDATE_TEACHING_ASSIGNMENT_ORDER";
'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:AssignmentCtrl
 * @description
 * # AssignmentCtrl
 * Controller of the ipaClientAngularApp
 */
assignmentApp.controller('AssignmentCtrl', ['$scope', '$rootScope', '$routeParams', '$uibModal', 'assignmentActionCreators', 'assignmentService',
		this.AssignmentCtrl = function ($scope, $rootScope, $routeParams, $uibModal, assignmentActionCreators, assignmentService) {
			$scope.workgroupId = $routeParams.workgroupId;
			$scope.year = $routeParams.year;
			$scope.view = {};

			$rootScope.$on('assignmentStateChanged', function (event, data) {
				$scope.view.state = data;
				console.log($scope.view.state);
			});

			$scope.showInstructors = function () {
				assignmentActionCreators.showInstructors();
			}

			$scope.showCourses = function () {
				assignmentActionCreators.showCourses();
			};

			$scope.termToggled = function(id) {
				assignmentActionCreators.toggleTermFilter(id);
			}

			$scope.approveInstructorAssignment = function(teachingAssignmentId) {
				var teachingAssignment = $scope.view.state.teachingAssignments.list[teachingAssignmentId];
				assignmentActionCreators.approveInstructorAssignment(teachingAssignment);
			};

			$scope.unapproveInstructorAssignment = function(teachingAssignmentId) {
				var teachingAssignment = $scope.view.state.teachingAssignments.list[teachingAssignmentId];
				assignmentActionCreators.unapproveInstructorAssignment(teachingAssignment);
			};

			$scope.addAndApproveInstructorAssignment = function(sectionGroupId, instructorId, termCode) {
				var teachingAssignment = {
					sectionGroupId: sectionGroupId,
					instructorId: instructorId,
					termCode: termCode,
					priority: 1,
					approved: true
				}

				assignmentActionCreators.addAndApproveInstructorAssignment(teachingAssignment);
			};

			// Triggered by global search field, redraws table based on query
			$scope.filterTable = function(query) {
				clearTimeout($scope.t);
				$scope.t = setTimeout($scope.startFilter, 700, query);
			}

			$scope.startFilter = function(query) {
				assignmentActionCreators.updateTableFilter(query);
			}

			// Launches TeachingCall Config modal and controller
			$scope.openTeachingCallConfig = function() {
				modalInstance = $uibModal.open({
					templateUrl: 'ModalTeachingCallConfig.html',
					controller: ModalTeachingCallConfigCtrl,
					size: 'lg',
					resolve: {
						scheduleYear: function () {
							return $scope.year;
						},
						workgroupId: function () {
							return $scope.workgroupId;
						},
						viewState: function () {
							return $scope.view.state;
						},
						allTerms: function () {
							return assignmentService.allTerms();
						}
					}
				});

				modalInstance.result.then(function (teachingCallConfig) {
					$scope.startTeachingCall($scope.workgroupId, $scope.year, teachingCallConfig);
				});
			};

			// Triggered on TeachingCall Config submission
			$scope.startTeachingCall = function(workgroupId, year, teachingCallConfig) {
				teachingCallConfig.termsBlob = "";
				var allTerms = ['05','06','07','08','09','10','01','02','03'];

				for (var i = 0; i < allTerms.length; i++) {
					if (teachingCallConfig.activeTerms[allTerms[i]] == true) {
						teachingCallConfig.termsBlob += "1";
					} else {
						teachingCallConfig.termsBlob += "0";
					}
				}

				delete teachingCallConfig.activeTerms;

				assignmentActionCreators.createTeachingCall(workgroupId, year, teachingCallConfig);
			};

			// Launched from the instructorTable directive UI handler
			$scope.openCommentModal = function(instructorId) {
				var instructor = $scope.view.state.instructors.list[instructorId];
				var scheduleInstructorNote = {};

				// Create new scheduleInstructorNote object if one does not already exist
				if (instructor.scheduleInstructorNoteId) {
					scheduleInstructorNote = $scope.view.state.scheduleInstructorNotes.list[instructor.scheduleInstructorNoteId];
				} else {
					scheduleInstructorNote = {};
					scheduleInstructorNote.instructorComment = "";
				}

				// Find a teachingCallReceipt for this instructor and schedule, if one exists.
				var teachingCallReceipt = null;

				for (var i = 0; i < $scope.view.state.teachingCallReceipts.ids.length; i++) {
					teachingCallReceipt = $scope.view.state.teachingCallReceipts.list[$scope.view.state.teachingCallReceipts.ids[i]];

					if (teachingCallReceipt.instructorId == instructor.id) {
						break;
					}
				}

				modalInstance = $uibModal.open({
					templateUrl: 'ModalComment.html',
					controller: ModalCommentCtrl,
					size: 'lg',
					resolve: {
						instructor: function () {
							return instructor;
						},
						privateComment: function () {
							return scheduleInstructorNote.instructorComment;
						},
						instructorComment: function () {
							return teachingCallReceipt.comment;
						}
					}
				});

				modalInstance.result.then(function (privateComment) {
					if (privateComment != scheduleInstructorNote.comment) {
						// Update the scheduleInstructorNote
						if (scheduleInstructorNote && scheduleInstructorNote.id) {
							scheduleInstructorNote.instructorComment = privateComment;
							assignmentActionCreators.updateScheduleInstructorNote(scheduleInstructorNote);
						}
						// Create new scheduleInstructorNote
						else {
							assignmentActionCreators.addScheduleInstructorNote(instructor.id, $scope.year, $scope.workgroupId, privateComment);
						}
					}
				});
			};

			$scope.openUnavailabilityModal = function(instructorId) {
				var instructor = $scope.view.state.instructors.list[instructorId];
	
				var termDisplayNames = {};
				

				modalInstance = $uibModal.open({
					templateUrl: 'ModalUnavailability.html',
					controller: ModalUnavailabilityCtrl,
					size: 'lg',
					resolve: {
						teachingCallResponses: function () {
							return instructor.teachingCallResponses;
						},
						termDisplayNames: function () {
							return assignmentService.allTerms();
						},
						instructor: function () {
							return instructor;
						}
					}
				});

				modalInstance.result.then(function () {
				});
			};
	}]);

AssignmentCtrl.validate = function (authService, assignmentActionCreators, $route) {
	authService.validate(localStorage.getItem('JWT'), $route.current.params.workgroupId, $route.current.params.year).then( function() {
		assignmentActionCreators.getInitialState($route.current.params.workgroupId, $route.current.params.year);
	})
}
assignmentApp.controller('ModalCommentCtrl', this.ModalCommentCtrl = function($scope, $rootScope, $uibModalInstance, instructor, privateComment, instructorComment) {
	$scope.instructor = instructor;
	$scope.privateComment = privateComment;
	$scope.instructorComment = instructorComment;

	$scope.confirm = function () {
		$uibModalInstance.close($scope.privateComment);
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

});
assignmentApp.controller('ModalTeachingCallConfigCtrl', this.ModalTeachingCallConfigCtrl = function($scope, $rootScope, $uibModalInstance, scheduleYear, viewState, workgroupId, allTerms) {
	$scope.startTeachingCallConfig = {};
	$scope.startTeachingCallConfig.sentToFederation = false;
	$scope.startTeachingCallConfig.sentToSenate = false;
	$scope.startTeachingCallConfig.dueDate = "";
	$scope.startTeachingCallConfig.showUnavailabilities = true;
	$scope.startTeachingCallConfig.message = "Please consider your teaching for next year in light of what you have taught in recent years.";
	$scope.startTeachingCallConfig.message += " As always, we will attempt to accommodate your requests, but we may need to ask some of you to make changes in order to balance our course offerings effectively.";
	$scope.startTeachingCallConfig.emailInstructors = true;

	// TODO: test data, remove

	$scope.activeTermIds = [];

	$scope.view = {};
	$scope.viewState = viewState;
	$scope.viewState.showPage1 = true;
	$scope.scheduleYear = scheduleYear;
	$scope.workgroupId = workgroupId;

	$scope.minDate = new Date();
	$scope.parent = {dueDate:''};

	$scope.senateInstructors = {};
	$scope.federationInstructors = {};

	$scope.startTeachingCallConfig.activeTerms = {};
	$scope.allTerms = allTerms;
	$scope.displayedFormPage = 1;

	var allTerms = ['01','02','03','04','05','06','07','08','09','10'];
	for (var i = 0; i < allTerms.length; i++) {
		$scope.startTeachingCallConfig.activeTerms[allTerms[i]] = false;
	}

	// Use schedule data to pre-select terms in TeachingCall creation form
	for (var i = 0; i < $scope.viewState.scheduleTermStates.ids.length; i++) {
		var termCode = $scope.viewState.scheduleTermStates.ids[i];
		var term = String(termCode).slice(-2);
		$scope.startTeachingCallConfig.activeTerms[term] = true;
	}

	// If schedule had no terms, default to pre-select SS1,SS2,F,W,S in TeachingCall creation form
	if ($scope.viewState.scheduleTermStates.ids.length == 0) {
		$scope.startTeachingCallConfig.activeTerms['05'] = true;
		$scope.startTeachingCallConfig.activeTerms['07'] = true;
		$scope.startTeachingCallConfig.activeTerms['01'] = true;
		$scope.startTeachingCallConfig.activeTerms['03'] = true;
		$scope.startTeachingCallConfig.activeTerms['10'] = true;
	}

	$scope.open = function($event, id, type) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.opened  = {start: false, end: false};
		if(type == 'start') {
			$scope.opened.start = true;
		}
		if(type == 'end') {
			$scope.opened[id].end = true;
		}
	};

	$scope.start = function (emailInstructors) {
		$scope.startTeachingCallConfig.emailInstructors = emailInstructors;
		$uibModalInstance.close($scope.startTeachingCallConfig);
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.isFormIncomplete = function () {
		if ($scope.startTeachingCallConfig.dueDate != "" && $scope.startTeachingCallConfig.message != "") {
			if ($scope.startTeachingCallConfig.sentToFederation || $scope.startTeachingCallConfig.sentToSenate) {
				return false;
			}
		}
		return true;
	}

	// Transforms to ISO format
	$scope.saveDueDate = function () {
		if ($scope.parent.dueDate != "") {
			$scope.startTeachingCallConfig.dueDate =  $scope.parent.dueDate.toISOString().slice(0, 10);
		}
	}

	$scope.isTermActive = function(term) {
		if ($scope.startTeachingCallConfig.activeTerms != null) {
			return $scope.startTeachingCallConfig.activeTerms[term];
		}

		return false;
	}

	$scope.toggleTermActive = function(term) {
		var term = term.slice(-2);
		$scope.startTeachingCallConfig.activeTerms[term] = !$scope.startTeachingCallConfig.activeTerms[term];
	}

	$scope.getTermName = function(term) {
		return termService.getTermName(term);
	}

	$scope.activeTermsDescription = function() {
		var description = "";

		for (var i = 0; i < $scope.allTerms.length; i++) {
			if ($scope.startTeachingCallConfig.activeTerms && $scope.startTeachingCallConfig.activeTerms[$scope.allTerms[i]]) {
				if (description.length > 0) {
					description += ", ";
				}
				description += $scope.getTermName($scope.allTerms[i]);
			}
		}

		return description;
	}

	$scope.toggleSenateInstructors = function() {
		$scope.startTeachingCallConfig.sentToSenate = !$scope.startTeachingCallConfig.sentToSenate;
	}

	$scope.toggleFederationInstructors = function() {
		$scope.startTeachingCallConfig.sentToFederation = !$scope.startTeachingCallConfig.sentToFederation;
	}

	$scope.getTermName = function(term) {
		var endingYear = "";
		if (term.length == 6) {
			endingYear = term.substring(0,4);
			term = term.slice(-2);
		}

		termNames = {
			'05': 'Summer Session 1',
			'06': 'Summer Special Session',
			'07': 'Summer Session 2',
			'08': 'Summer Quarter',
			'09': 'Fall Semester',
			'10': 'Fall Quarter',
			'01': 'Winter Quarter',
			'02': 'Spring Semester',
			'03': 'Spring Quarter'
		};

		return termNames[term] + " " + endingYear;
	};

	// Datepicker config
	$scope.inlineOptions = {
		minDate: new Date(),
		showWeeks: true
	};

	$scope.dateOptions = {
		formatYear: 'yy',
		maxDate: new Date(2020, 5, 22),
		minDate: new Date(),
		startingDay: 1
	};
	
	$scope.popup1 = {};
	$scope.open1 = function() {
		$scope.popup1.opened = true;
	};

	$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
	$scope.format = $scope.formats[1];
	$scope.altInputFormats = ['M!/d!/yyyy'];

	$scope.createWithoutEmail = function() {
		$scope.startTeachingCallConfig.emailInstructors = false;
		$uibModalInstance.close($scope.startTeachingCallConfig);
	};

	$scope.createAndEmail = function() {
		$scope.startTeachingCallConfig.emailInstructors = true;
		$uibModalInstance.close($scope.startTeachingCallConfig);
	};

});
assignmentApp.controller('ModalUnavailabilityCtrl', this.ModalUnavailabilityCtrl = function($scope, $rootScope, $uibModalInstance, assignmentActionCreators, teachingCallResponses, termDisplayNames, instructor) {
	$scope.teachingCallResponses = teachingCallResponses;
	$scope.termDisplayNames = termDisplayNames;
	$scope.instructor = instructor;

	$scope.confirm = function () {
		$uibModalInstance.close();
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.saveUnavailabilities = function (teachingCallResponse, blob) {
		teachingCallResponse.availabilityBlob = blob;
		assignmentActionCreators.updateTeachingCallResponse(teachingCallResponse);
	}
});
'use strict';

/**
 * @ngdoc function
 * @name ipaClientAngularApp.controller:TeachingCallCtrl
 * @description
 * # TeachingCallCtrl
 * Controller of the ipaClientAngularApp
 */
assignmentApp.controller('TeachingCallCtrl', ['$scope', '$rootScope', '$routeParams', '$timeout', 'assignmentActionCreators',
		this.TeachingCallCtrl = function ($scope, $rootScope, $routeParams, $timeout, assignmentActionCreators) {
			$scope.workgroupId = $routeParams.workgroupId;
			$scope.year = $routeParams.year;
			$scope.nextYear = parseInt($scope.year) + 1;
			$scope.view = {};

			$rootScope.$on('assignmentStateChanged', function (event, data) {
				$scope.view.state = data;
				if ($scope.view.state.activeTeachingCall.scheduledCourses == null) {
					$scope.prepareTeachingCall();
				}

				console.log($scope.view.state);
			});

			$scope.viewState = {};

			// Convert teachingCall active terms 'termsBlob' to array
			$scope.getActiveTerms = function() {
				var sortedTerms = ['05','06','07','08','09','10','01','02','03'];
				var termsBlob = $scope.view.state.activeTeachingCall.termsBlob;
				var teachingCallTerms = [];

				for (var i = 0; i < sortedTerms.length; i++) {
					if (termsBlob.charAt(i) == 1) {
						teachingCallTerms.push(sortedTerms[i]);
					}
				}

				return teachingCallTerms;
			}

			$scope.getTermName = function(term) {
				termNames = {
					'05': 'Summer Session 1',
					'06': 'Summer Special Session',
					'07': 'Summer Session 2',
					'08': 'Summer Quarter',
					'09': 'Fall Semester',
					'10': 'Fall Quarter',
					'01': 'Winter Quarter',
					'02': 'Spring Semester',
					'03': 'Spring Quarter'
				};

				return termNames[term];
			};

			$scope.getCourseOfferingIdsFromPreferences = function(preferences) {
				if (!preferences) return;
				return preferences.filter(function(preference) {
					return preference.courseOffering;
				}).map(function(preference) {
					return preference.courseOffering.id;
				});
			};

			$scope.getCoursesFromPreferences = function(preferences) {
				if (!preferences) return;
				return preferences.filter(function(preference) {
					return preference.course;
				}).map(function(preference) {
					return preference.course;
				});
			};

			$scope.addPreference = function(preference, courseOffering, isBuyout, isSabbatical, isCourseRelease) {
				var courseNumber, subjectCode, sectionGroup;
				var term = courseOffering;
				var scheduleId = $scope.view.state.activeTeachingCall.scheduleId;

				if (preference) {
					courseNumber = preference.courseNumber;
					subjectCode = preference.subjectCode;

					// Find an appropriate sectionGroup
					for (var i = 0; i < $scope.view.state.sectionGroups.ids.length; i++) {
						var slotSectionGroup = $scope.view.state.sectionGroups.list[$scope.view.state.sectionGroups.ids[i]];
						var slotCourse = $scope.view.state.courses.list[slotSectionGroup.courseId];
						var instructor = $scope.view.state.instructors.list[$scope.view.state.userInterface.instructorId];
						if (slotCourse.subjectCode == subjectCode && slotCourse.courseNumber == courseNumber) {
							sectionGroup = slotSectionGroup;
							break;
						}
					}
				}

				var teachingAssignment = {};
				teachingAssignment.termCode = term;
				// Used as a model for courseNumber/sectionGroup/scheduleId association
				teachingAssignment.sectionGroup = sectionGroup;
				teachingAssignment.sectionGroupId = sectionGroup.id;
				teachingAssignment.instructor = instructor;
				teachingAssignment.instructorId = instructor.id;

				teachingAssignment.isBuyout = isBuyout;
				teachingAssignment.isSabbatical = isSabbatical;
				teachingAssignment.isCourseRelease = isCourseRelease;
				teachingAssignment.schedule = {id: scheduleId};
				teachingAssignment.scheduleId = scheduleId;

				assignmentActionCreators.addPreference(teachingAssignment);
			};

			$scope.removePreference = function(teachingAssignment) {
				assignmentActionCreators.removePreference(teachingAssignment);
			};

			$scope.updateAssignmentsOrder = function(sortedTeachingPreferenceIds, term) {
				assignmentActionCreators.updateAssignmentsOrder(sortedTeachingPreferenceIds, $scope.view.state.userInterface.scheduleId);
			};

			$scope.termHasSabbatical = function(term) {
				var termPrefs = $scope.termPreferences[term] || [];
				for (var i = 0; i < termPrefs.length ; i++) {
					if (termPrefs[i].isSabbatical) return true;
				}
				return false;
			};

			$scope.copyUnabailabilitiesToAllTerms = function(blob) {
				//Cancel all pending timeouts
				for (var term in $scope.timeout) {
					$timeout.cancel($scope.timeout[term]);
				}

				angular.forEach($scope.terms, function(term) {
					$scope.saveTeachingCallResponse(term, blob, 0);
				});
			};

			$scope.saveTeachingCallResponse = function(term, blob, delay) {
				// Identify is updating or creating

				var termCode = $scope.termToTermCode(term);
				var teachingCallResponse = $scope.view.state.activeTeachingCall.teachingCallResponsesByTermCode[term] || {};
				teachingCallResponse.availabilityBlob = blob || teachingCallResponse.availabilityBlob;
				teachingCallResponse.termCode = termCode;
				teachingCallResponse.instructorId = $scope.view.state.userInterface.instructorId;
				teachingCallResponse.teachingCallId = $scope.view.state.activeTeachingCall.id;

				// Report changes back to server after some delay
				$timeout.cancel($scope.timeout[term]);
				$scope.timeout[term] = $timeout(function() {
					if (teachingCallResponse.id) {
						assignmentActionCreators.updateTeachingCallResponse(teachingCallResponse);
					} else {
						assignmentActionCreators.addTeachingCallResponse(teachingCallResponse);
					}
				}, delay);
			};

			$scope.updateTeachingCallReceipt = function(markAsDone) {
				var teachingCallReceipt = $scope.view.state.activeTeachingCall.teachingCallReceipt;

				if (markAsDone) {
					teachingCallReceipt.isDone = true;
				}

				assignmentActionCreators.updateTeachingCallReceipt(teachingCallReceipt);
			};

			$scope.isScheduleTermLocked = function(term) {
				var termCode = $scope.termToTermCode(term);

				return $scope.view.state.scheduleTermStates.list[termCode].isLocked;
			};
/*
			$scope.refreshPreferences = function() {
				$scope.termPreferences = teachingPreferenceService.retrieveInstancesSortedByTerm();
			};

			$scope.autoSave = function() {
				$scope.viewState.lastSaved = moment().format('LTS');
			};
*/
			$scope.prepareTeachingCall = function() {
				var activeTeachingCall = $scope.view.state.activeTeachingCall;

				activeTeachingCall.terms = $scope.getActiveTerms();

				activeTeachingCall.termAssignments = {};

				// Holds sectionGroupIds that should not be offered as preferences to add
				var alreadyHasPreferenceSectionGroupIds = [];

				// Building an object of teachingAssignments for this instructor, separated by term
				for (var i = 0; i < $scope.view.state.teachingAssignments.ids.length; i++) {
					var teachingAssignment = $scope.view.state.teachingAssignments.list[$scope.view.state.teachingAssignments.ids[i]];

					if (teachingAssignment.instructorId == $scope.view.state.userInterface.instructorId) {
						var sectionGroup = $scope.view.state.sectionGroups.list[teachingAssignment.sectionGroupId];
						var course = $scope.view.state.courses.list[sectionGroup.courseId];

						teachingAssignment.subjectCode = course.subjectCode;
						teachingAssignment.courseNumber = course.courseNumber;

						if (activeTeachingCall.termAssignments[teachingAssignment.termCode] == null) {
							activeTeachingCall.termAssignments[teachingAssignment.termCode] = [];
						};

						activeTeachingCall.termAssignments[teachingAssignment.termCode].push(teachingAssignment);
						alreadyHasPreferenceSectionGroupIds.push(teachingAssignment.sectionGroupId);
					}
				}

				// Building an object separated by terms, of unique courses based on schedule sectionGroups
				activeTeachingCall.scheduledCourses = {};

				for (var i = 0; i < $scope.view.state.sectionGroups.ids.length; i++) {
					var sectionGroup = $scope.view.state.sectionGroups.list[$scope.view.state.sectionGroups.ids[i]];
					var originalCourse = $scope.view.state.courses.list[sectionGroup.courseId];
					var course = jQuery.extend(true, {}, originalCourse);

					var termCode = parseInt(sectionGroup.termCode);
					// Adding metadata from sectionGroup
					course.seatsTotal = sectionGroup.plannedSeats;

					// Ignore courses being suppressed
					if (course.isHidden == false) {

						// Ensure termCode has been added
						if (activeTeachingCall.scheduledCourses[termCode] == null) {
							activeTeachingCall.scheduledCourses[termCode] = [];
						}

						// Ensure course hasn't already been added
						var courseAlreadyExists = false;

						for (var j = 0; j < activeTeachingCall.scheduledCourses[termCode].length; j++) {
							var slotCourse = activeTeachingCall.scheduledCourses[termCode][j];

							if (slotCourse.subjectCode == course.subjectCode
								&& slotCourse.courseNumber == course.courseNumber) {
								courseAlreadyExists = true;
								break;
							}
						}

						if (courseAlreadyExists == false) {
							if (alreadyHasPreferenceSectionGroupIds.indexOf(course.sectionGroupTermCodeIds[termCode]) > -1) {
								course.hasPreference = true;
							} else {
								course.hasPreference = false;
							}

							activeTeachingCall.scheduledCourses[termCode].push(course);
						}
					}
				}

				// Set teachingCallReceipt
				for (var i = 0; i < $scope.view.state.teachingCallReceipts.ids.length; i++) {
					var slotTeachingCallReceipt = $scope.view.state.teachingCallReceipts.list[$scope.view.state.teachingCallReceipts.ids[i]];
					if (slotTeachingCallReceipt.instructorId == $scope.view.state.userInterface.instructorId
						&& slotTeachingCallReceipt.teachingCallId == activeTeachingCall.id) {
							activeTeachingCall.teachingCallReceiptId = slotTeachingCallReceipt.id;
							activeTeachingCall.teachingCallReceipt = slotTeachingCallReceipt;
							break;
						}
				}
				activeTeachingCall.teachingCallReceipt = $scope.view.state.teachingCallReceipts.list[$scope.view.state.activeTeachingCall.teachingCallReceiptId];
				activeTeachingCall.teachingCallResponsesByTermCode = {};

				for (var i = 0; i < $scope.view.state.activeTeachingCall.terms.length; i++) {
					var termCode = $scope.termToTermCode($scope.view.state.activeTeachingCall.terms[i]);
					activeTeachingCall.teachingCallResponsesByTermCode[termCode] = {};

					for (var j = 0; j < $scope.view.state.teachingCallResponses.ids.length; j++) {
						var slotTeachingCallResponse = $scope.view.state.teachingCallResponses.list[$scope.view.state.teachingCallResponses.ids[j]];

						if (slotTeachingCallResponse.instructorId == $scope.view.state.userInterface.instructorId
						&& slotTeachingCallResponse.termCode == termCode) {
							activeTeachingCall.teachingCallResponsesByTermCode[termCode] = slotTeachingCallResponse;
						}
					}
				}

				assignmentActionCreators.initializeActiveTeachingCall(activeTeachingCall);
			}

			$scope.termToTermCode = function(term) {
				// Already a termCode
				if (term.length == 6) {
					return term;
				}

				var year = $scope.year;

				switch(term) {
					case "01":
					case "02":
					case "03":
						year++;
						break;
					default:
						year;
				}
				var termCode = year + term;

				return termCode;
			}

			$scope.termCodeToTerm = function(termCode) {
				return termCode.slice(-2);
			}
			//$scope.terms = termService.getActiveTerms();

			//$scope.year = sharedService.selectedYear();
			//$scope.activeWorkgroup = userService.getActiveWorkgroup();
			//$scope.termPreferences = teachingPreferenceService.retrieveInstancesSortedByTerm();
			//$scope.teachingCall = teachingCall;
			//$scope.teachingCallReceipt = teachingCallReceipt;
			//$scope.teachingCallResponse = teachingCallResponseService.retrieveInstancesSortedByTerm();
			//$scope.terms = termService.setActiveTermsByTermsBlob(teachingCall.termsBlob);
			//$scope.courseOfferings = courseOfferings;
			//$scope.instructorId = userService.getCurrentUser().instructorId;
			$scope.timeout = {};
			setTimeout(function() {
				$( ".sortable-list" ).sortable();
			}, 1000);

	}]);

TeachingCallCtrl.validate = function (authService, assignmentActionCreators, $route) {
	authService.validate(localStorage.getItem('JWT'), $route.current.params.workgroupId, $route.current.params.year).then( function() {
		assignmentActionCreators.getInitialState($route.current.params.workgroupId, $route.current.params.year);
	})
}
/**
 * Provides the main course table in the Courses View
 */
assignmentApp.directive("courseAssignmentTable", this.courseAssignmentTable = function ($rootScope, assignmentActionCreators) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			scope.view = {};

			$rootScope.$on('assignmentStateChanged', function (event, data) {
				scope.view.state = data;
				// Clear the table
				$('.tooltip').remove();
				element.empty();
				// Render the header
				var header = "<div class=\"course-list-row\">";
				header += "<div class=\"course-header course-description-cell\">Course</div>";

				$.each(scope.view.state.userInterface.enabledTerms.ids, function(i, termCodeId) {

					var termCode = scope.view.state.userInterface.enabledTerms.list[termCodeId];
					header += "<div class=\"term-header term-cell\">" + termCode.getTermCodeDisplayName(true) + "</div>";
				});

				header += "</div>";
				element.append(header);

				var coursesHtml = "";

				// Loop over courses (sectionGroup rows)
				$.each(scope.view.state.courses.ids, function(i, courseId) {
					var course = scope.view.state.courses.list[courseId];
					if (course.isHidden == false && course.isFiltered == false) {
						var courseHtml = "";
						courseHtml += "<div class=\"course-list-row\">";
						courseHtml += "<div class=\"course-description-cell\"><div><div class=\"course-title\">";
						courseHtml += course.subjectCode + " " + course.courseNumber + " " + course.title + " " + course.sequencePattern;
						courseHtml += "</div>";
						courseHtml += "<div class=\"course-units\">";
						courseHtml += "Units: " + course.unitsLow;
						courseHtml += "</div></div></div>";
						
						// Loop over active terms
						$.each(scope.view.state.userInterface.enabledTerms.ids, function(i, termCodeId) {
							var termCode = scope.view.state.userInterface.enabledTerms.list[termCodeId];

							courseHtml += "<div class=\"term-cell\">";
							
							var sectionGroupId = course.sectionGroupTermCodeIds[termCode];
							if (sectionGroupId) {
								var sectionGroup = scope.view.state.sectionGroups.list[sectionGroupId];

								// Adding sectionGroup Seats
								courseHtml += "<div class=\"assignment-seats-container\">";
								courseHtml += "<span class=\"assignment-seats\" data-toggle=\"tooltip\" data-placement=\"top\"";
								courseHtml += "data-original-title=\"Seats\" data-container=\"body\">";
								courseHtml += scope.view.state.sectionGroups.list[sectionGroupId].plannedSeats + "</span>";
								courseHtml += "</div>";

								// Loop over teachingAssignments that are approved
								$.each(sectionGroup.teachingAssignmentIds, function(i, teachingAssignmentId) {
									var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];

									if (teachingAssignment.approved == true) {
										var instructor = scope.view.state.instructors.list[teachingAssignment.instructorId];
										// Add approved teachingAssignment to term
										courseHtml += "<div class=\"alert alert-info tile-assignment\">";

										if (instructor == undefined) {
											courseHtml += "instructorId not found: " + teachingAssignment.instructorId;
										} else {
											courseHtml += instructor.fullName;
										}

										courseHtml += "<i class=\"btn glyphicon glyphicon-remove assignment-remove text-primary\" data-toggle=\"tooltip\"";
										courseHtml += " data-placement=\"top\" data-original-title=\"Unassign\" data-container=\"body\""
										courseHtml += " data-teaching-assignment-id=\"" + teachingAssignmentId + "\"></i>";
										courseHtml += "</div>"; // Ending Teaching assignment div
									}
								});

								// Add an assign button to add more instructors
								courseHtml += "<div class=\"dropdown assign-dropdown\">";
								courseHtml += "<button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">";
								courseHtml += "Assign..<span class=\"caret\"></span></button>";
								courseHtml += "<ul class=\"dropdown-menu scrollable-menu\" aria-labelledby=\"dropdownMenu1\">";

								var interestedInstructorIds = [];
								var firstInstructorAdded = false;

								if (sectionGroup.teachingAssignmentIds.length > 0) {

									// Loop over instructors who are interested in this course
									$.each(sectionGroup.teachingAssignmentIds, function(i, teachingAssignmentId) {
										var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
										var instructor = scope.view.state.instructors.list[teachingAssignment.instructorId];

										if (instructor) {
											interestedInstructorIds.push(instructor.id);
										}

										if (teachingAssignment.approved == false && instructor) {
											// Ensure header is aded only if there is appropriate to display
											if (firstInstructorAdded == false) {
												courseHtml += "<li><div class=\"dropdown-assign-header\">Interested</div></li>";
												firstInstructorAdded = true;
											}

											courseHtml += "<li><a";
											courseHtml += " data-section-group-id=\"" + sectionGroupId + "\"";
											courseHtml += " data-instructor-id=\"" + teachingAssignment.instructorId + "\"";
											courseHtml += " data-teaching-assignment-id=\"" + teachingAssignmentId + "\"";

											courseHtml += " href=\"#\">" + instructor.fullName + "</a></li>";
										}
									});
									if (firstInstructorAdded) {
										courseHtml += "<li><div class=\"dropdown-assign-header\">Other</div></li>";
									}
								}

								// Loop over instructors who are not interested in this course
								$.each(scope.view.state.instructors.ids, function(i, instructorId) {
									var instructor = scope.view.state.instructors.list[instructorId];
									if (interestedInstructorIds.indexOf(instructor.id) < 0) {
										courseHtml += "<li><a";
										courseHtml += " data-section-group-id=\"" + sectionGroupId + "\"";
										courseHtml += " data-instructor-id=\"" + instructorId + "\"";
										courseHtml += " href=\"#\">" + instructor.fullName + "</a></li>";
									}
								});

								courseHtml += "</ul></div>";
							} else {
								courseHtml += "Not Offered";
							}
							courseHtml += "</div>"; // Ending term-cell div
						});
						courseHtml += "</div>"; // Ending course-row div
						
						coursesHtml += courseHtml;
					}
				}); // Ending loop over courses

				element.append(coursesHtml);

				// Manually activate bootstrap tooltip triggers
				$('body').tooltip({
    			selector: '[data-toggle="tooltip"]'
				});
			}); // end on event 'assignmentStateChanged'

			// Handle Instructor UI events
			element.click(function(e) {
				$el = $(e.target);

				// Approving a teachingAssignment or creating a new one
				if ($el.is('a')) {
					var sectionGroupId = $el.data('section-group-id');
					var instructorId = $el.data('instructor-id');
					var teachingAssignmentId = $el.data('teaching-assignment-id');
					// Approving an existing teachingAssignment
					if (teachingAssignmentId) {
						var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
						assignmentActionCreators.approveInstructorAssignment(teachingAssignment);
					} else { // Creating a new teachingAssignment, and then approving it
						var sectionGroup = scope.view.state.sectionGroups.list[sectionGroupId];
						var teachingAssignment = {
							sectionGroupId: sectionGroupId,
							instructorId: instructorId,
							termCode: sectionGroup.termCode,
							priority: 1,
							approved: true
						}

						assignmentActionCreators.addAndApproveInstructorAssignment(teachingAssignment, scope.view.state.userInterface.scheduleId);
					}
				}
				// Unapproving a teachingAssignment
				else if ($el.hasClass('assignment-remove')) {
						var teachingAssignmentId = $el.data('teaching-assignment-id');
						var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
						assignmentActionCreators.unapproveInstructorAssignment(teachingAssignment);
				}
			}); // end UI event handler
		} // end link
	}
});

/**
 * Provides the main course table in the Courses View
 */
assignmentApp.directive("instructorAssignmentTable", this.instructorAssignmentTable = function ($rootScope, assignmentActionCreators) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			scope.view = {};

			$rootScope.$on('assignmentStateChanged', function (event, data) {
				scope.view.state = data;
				// Clear the table
				$('.tooltip').remove();
				element.empty();
				// Render the header
				var header = "<div class=\"course-list-row\">";
				header += "<div class=\"course-header description-cell\">Instructor</div>";

				$.each(scope.view.state.userInterface.enabledTerms.ids, function(i, termCodeId) {
					var termCode = scope.view.state.userInterface.enabledTerms.list[termCodeId];

					header += "<div class=\"term-header term-cell\">" + termCode.toString().getTermCodeDisplayName(true) + "</div>";
				});

				header += "</div>";
				element.append(header);

				var coursesHtml = "";

				// Loop over instructors
				$.each(scope.view.state.instructors.ids, function(i, instructorId) {
					var instructor = scope.view.state.instructors.list[instructorId];
					if (instructor.isFiltered == false) {
						var scheduleInstructorNote = scope.view.state.scheduleInstructorNotes.list[instructor.scheduleInstructorNoteId];
						var teachingCallReceipt = scope.view.state.teachingCallReceipts.list[instructor.teachingCallReceiptId];

						var courseHtml = "";
						courseHtml += "<div class=\"course-list-row\">";
						courseHtml += "<div class=\"description-cell\">";
						courseHtml += "<div>";

						courseHtml += "<span style=\"margin-right:5px;\">";

						// Instructor assignmentCompleted UI
						courseHtml += "<i class=\"glyphicon";
						if (scheduleInstructorNote && scheduleInstructorNote.assignmentsCompleted) {
							courseHtml += " glyphicon-check";
						} else {
							courseHtml += " glyphicon-unchecked";
						}
						courseHtml += " assignments-complete clickable\" data-toggle=\"tooltip\" data-placement=\"right\" data-original-title=\"Toggle completed assigning instructor\" data-container=\"body\"";
						courseHtml += " data-instructor-id=" + instructor.id + " data-schedule-instructor-note-id=" + instructor.scheduleInstructorNoteId + "></i>";
						courseHtml += "</span>";
						courseHtml += "<div><strong>";
						courseHtml += instructor.fullName;
						courseHtml += "</strong>";
						courseHtml += "</div>";

						// Instructor Comment UI
						courseHtml += "<div class=\"description-cell__comment-btn-container\">";
						courseHtml += "<i class=\"glyphicon comment-btn glyphicon-pencil\" data-instructor-id=" + instructor.id;
						courseHtml += " data-toggle=\"tooltip\" data-placement=\"top\" data-original-title=\"Instructor comments\" data-container=\"body\"></i>";
						courseHtml += "</div>";

						// If they don't have any teachingCallResponses, there won't be any unavailabilities to show
						courseHtml += "<div class=\"description-cell__avail-btn-container\">";

						if (instructor.teachingCallResponses.length > 0) {
							// Instructor Availabilities UI
							courseHtml += "<i class=\"glyphicon avail-btn glyphicon-calendar\" data-instructor-id=" + instructor.id;
							courseHtml += " data-toggle=\"tooltip\" data-placement=\"top\" data-original-title=\"Instructor unavailabilities\" data-container=\"body\"></i>";
						} else {
							courseHtml += "<div data-toggle=\"tooltip\" data-placement=\"top\" data-original-title=\"No unavailabilities\" data-container=\"body\">";
							courseHtml += "<i class=\" disabled disabled-calendar glyphicon glyphicon-calendar\"></i>";
							courseHtml += "</div>";
						}

						courseHtml += "</div>";
						courseHtml += "</div>";


						// Instructor TeachingCall submitted preferences checkmark
						if (teachingCallReceipt && teachingCallReceipt.isDone) {
							courseHtml += "<div style=\"color:#B3B3B3; display: flex;\">";
							courseHtml += "Preferences Submitted";
							courseHtml += "</div>";
						}

						courseHtml += "</div>"; // end description-cell
						
						// Loop over active terms
						$.each(scope.view.state.userInterface.enabledTerms.ids, function(i, termCodeId) {
							var termCode = scope.view.state.userInterface.enabledTerms.list[termCodeId];

							courseHtml += "<div class=\"term-cell\">";

							// Loop over teachingAssignments within a term
							$.each(scope.view.state.instructors.list[instructor.id].teachingAssignmentTermCodeIds[termCode], function(j, teachingAssignmentId) {
								// Ensure it is approved already
								if (scope.view.state.teachingAssignments.list[teachingAssignmentId].approved) {
									var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId]
									var sectionGroup = scope.view.state.sectionGroups.list[teachingAssignment.sectionGroupId];

									var displayTitle = "";
									var plannedSeats = "";
									var unitsLow = "";

									if (sectionGroup) {
										var course = scope.view.state.courses.list[sectionGroup.courseId];
										displayTitle += course.subjectCode + " " + course.courseNumber + "-" + course.sequencePattern;
										plannedSeats = "<small>Seats: " + sectionGroup.plannedSeats + "</small>";
										unitsLow = "<small>Units: " + course.unitsLow + "</small>";
									} else {
										if (teachingAssignment.buyout) {
											displayTitle += "BUYOUT";
										} else if (teachingAssignment.courseRelease) {
											displayTitle += "COURSE RELEASE";
										} else if (teachingAssignment.sabbatical) {
											displayTitle += "SABBATICAL";
										}
									}

									courseHtml += "<div class=\"alert alert-info tile-assignment\">";
									courseHtml += "<p>" + displayTitle + "</p>";
									courseHtml += "<div class=\"tile-assignment-details\">";
									courseHtml += plannedSeats;
									courseHtml += "<br />";
									courseHtml += unitsLow;
									courseHtml += "</div>";
									courseHtml += "<i class=\"btn glyphicon glyphicon-remove assignment-remove text-primary\" data-toggle=\"tooltip\" data-placement=\"top\"";
									courseHtml += " data-teaching-assignment-id=\"" + teachingAssignmentId + "\"";
									courseHtml += "data-original-title=\"Unassign\" data-container=\"body\"></i>";
									courseHtml += "</div>";
								}
							});

							// Add an assign button to add more instructors
							courseHtml += "<div class=\"dropdown assign-dropdown\">";
							courseHtml += "<button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">";
							courseHtml += "Assign..<span class=\"caret\"></span></button>";
							courseHtml += "<ul class=\"dropdown-menu scrollable-menu\" aria-labelledby=\"dropdownMenu1\">";

							// Track courses that were already present in 'interested', and should be filtered from 'other'
							var interestedCourseIds = [];
							var firstInterestedCourseAdded = false;

							// If the instructor has teachingAssignments in this term, show them first
							if (instructor.teachingAssignmentTermCodeIds[termCode] && instructor.teachingAssignmentTermCodeIds[termCode].length > 0) {

								// Loop over teachingAssignments
								$.each(instructor.teachingAssignmentTermCodeIds[termCode], function(i, teachingAssignmentId) {
									var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
									var sectionGroup = scope.view.state.sectionGroups.list[teachingAssignment.sectionGroupId];

									if (teachingAssignment.sectionGroupId == 0) {
										return true;
									}

									var course = scope.view.state.courses.list[sectionGroup.courseId];
									interestedCourseIds.push(course.id);

									// Show option if the TeachingAssignments parent Course is not being suppressed and Assignment is not already approved
									if (teachingAssignment.approved == false && course.isHidden == false) {
										if (firstInterestedCourseAdded == false) {
											courseHtml += "<li><div class=\"dropdown-assign-header\">Interested</div></li>";
											firstInterestedCourseAdded = true;
										}

										var instructor = scope.view.state.instructors.list[teachingAssignment.instructorId];
										courseHtml += "<li><a";
										courseHtml += " data-teaching-assignment-id=\"" + teachingAssignmentId + "\"";

										courseHtml += " href=\"#\">" + course.subjectCode + " " + course.courseNumber + " - " + course.sequencePattern + "</a></li>";
									}
								});
								if (firstInterestedCourseAdded) {
									courseHtml += "<li><div class=\"dropdown-assign-header\">Other</div></li>";
								}
							}

							// Add Buyout, Sabbatical, Course Release options
							courseHtml += "<li><a";
							courseHtml += " data-is-buyout=\"true\"";
							courseHtml += " data-term-code=\"" + termCode + "\"";
							courseHtml += " data-instructor-id=\"" + instructor.id + "\"";
							courseHtml += " href=\"#\">BUYOUT</a></li>";

							courseHtml += "<li><a";
							courseHtml += " data-is-sabbatical=\"true\"";
							courseHtml += " data-term-code=\"" + termCode + "\"";
							courseHtml += " data-instructor-id=\"" + instructor.id + "\"";
							courseHtml += " href=\"#\">SABBATICAL</a></li>";

							courseHtml += "<li><a";
							courseHtml += " data-is-course-release=\"true\"";
							courseHtml += " data-term-code=\"" + termCode + "\"";
							courseHtml += " data-instructor-id=\"" + instructor.id + "\"";
							courseHtml += " href=\"#\">COURSE RELEASE</a></li>";

							// Loop over all other courses
							$.each(scope.view.state.courses.ids, function(i, courseId) {
								var course = scope.view.state.courses.list[courseId]
								// Show option if course has a sectionGroup in this term, course is not suppressed, and course did not already show up in the interested section
								if (course.sectionGroupTermCodeIds[termCode] && course.isHidden == false && interestedCourseIds.indexOf(course.id) < 0) {
									var sectionGroupId = course.sectionGroupTermCodeIds[termCode];
									var instructor = scope.view.state.instructors.list[instructorId];
									courseHtml += "<li><a";
									courseHtml += " data-section-group-id=\"" + sectionGroupId + "\"";
									courseHtml += " data-term-code=\"" + termCode + "\"";
									courseHtml += " data-instructor-id=\"" + instructor.id + "\"";
									courseHtml += " href=\"#\">" + course.subjectCode + " " + course.courseNumber + " - " + course.sequencePattern + "</a></li>";
								}
							});

							courseHtml += "</ul></div>"; // End dropdown assign list
							courseHtml += "</div>"; // Ending term-cell div
						});
						courseHtml += "</div>"; // Ending course-row div

						coursesHtml += courseHtml;
					}
				}); // Ending loop over courses

				element.append(coursesHtml);

				// Manually activate bootstrap tooltip triggers
				$('body').tooltip({
    			selector: '[data-toggle="tooltip"]'
				});
			}); // end on event 'assignmentStateChanged'

			// Handle Instructor UI events
			element.click(function(e) {
				$el = $(e.target);
				// Approving a teachingAssignment or creating a new one
				if ($el.is('a')) {
					var sectionGroupId = $el.data('section-group-id');
					var isCourseRelease = $el.data('is-course-release');
					var isSabbatical = $el.data('is-sabbatical');
					var isBuyout = $el.data('is-buyout');
					var termCode = $el.data('term-code');

					var instructorId = $el.data('instructor-id');
					var teachingAssignmentId = $el.data('teaching-assignment-id');

					// Approving an existing teachingAssignment
					if (teachingAssignmentId) {

						var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
						assignmentActionCreators.approveInstructorAssignment(teachingAssignment);
					} else { // Creating a new teachingAssignment, and then approving it
						var sectionGroup = scope.view.state.sectionGroups.list[sectionGroupId];
						var teachingAssignment = {
							sectionGroupId: sectionGroupId,
							instructorId: instructorId,
							termCode: termCode,
							priority: 1,
							approved: true,
							buyout: isBuyout,
							courseRelease: isCourseRelease,
							sabbatical: isSabbatical
						}

						assignmentActionCreators.addAndApproveInstructorAssignment(teachingAssignment, scope.view.state.userInterface.scheduleId);
					}
				}
				// Unapproving a teachingAssignment
				else if ($el.hasClass('assignment-remove')) {
					var teachingAssignmentId = $el.data('teaching-assignment-id');
					var teachingAssignment = scope.view.state.teachingAssignments.list[teachingAssignmentId];
					assignmentActionCreators.unapproveInstructorAssignment(teachingAssignment);
				}
				else if ($el.hasClass('comment-btn')) {
					var instructorId = $el.data('instructor-id');
					scope.openCommentModal(instructorId);
				}
				else if ($el.hasClass('avail-btn')) {
					var instructorId = $el.data('instructor-id');
					scope.openUnavailabilityModal(instructorId);
				}
				else if ($el.hasClass('assignments-complete')) {
					var scheduleInstructorNoteId = $el.data('schedule-instructor-note-id');
					var instructorId = $el.data('instructor-id');
					var scheduleInstructorNote = scope.view.state.scheduleInstructorNotes.list[scheduleInstructorNoteId];

					// Properly toggle assignmentsCompleted of existing scheduleInstructorNote
					if (scheduleInstructorNote) {
						if ($el.hasClass('glyphicon-unchecked')) {
							scheduleInstructorNote.assignmentsCompleted = true;
						} else {
							scheduleInstructorNote.assignmentsCompleted = false;
						}
						assignmentActionCreators.updateScheduleInstructorNote(scheduleInstructorNote);
					}
					// Make a new scheduleInstructorNote
					else {
						assignmentActionCreators.addScheduleInstructorNote(instructorId, scope.year, scope.workgroupId, "", true);
					}
				}
			}); // end UI event handler
		} // end link
	}
});

assignmentApp.directive("select2", this.select2 = function () {
	return {
		restrict: 'C',
		scope: {
			optionIds: '=',
			selectedIds: '=',
			optionObjects: '='
		},
		link: function (scope, element, attrs) {
			scope.$watch("selectedIds", function () {
				if (scope.optionIds == undefined) return;

				element.empty();
				scope.optionIds.forEach(function (id) {
					var isSelected = scope.selectedIds.indexOf(id) >= 0;
					var optionBlock = $('<option></option>')
						.val(id)
						.attr('selected', isSelected)
						.html(scope.optionObjects[id].name);

					element.append(optionBlock)
				});

				element.select2();
				element.addClass('visible');
			});
		}
	}
});

'use strict';

/**
 * @ngdoc service
 * @name workgroupApp.workgroupActionCreators
 * @description
 * # workgroupActionCreators
 * Service in the workgroupApp.
 * Central location for sharedState information.
 */
assignmentApp.service('assignmentActionCreators', function (assignmentStateService, assignmentService, $rootScope, Role) {
	return {
		getInitialState: function (workgroupId, year) {
			assignmentService.getInitialState(workgroupId, year).then(function (payload) {
				var action = {
					type: INIT_ASSIGNMENT_VIEW,
					payload: payload,
					year: year
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		getInitialTeachingCallState: function (workgroupId, year) {
			assignmentService.getInitialTeachingCallState(workgroupId, year).then(function (payload) {
				var action = {
					type: INIT_TEACHING_CALL_VIEW,
					payload: payload,
					year: year
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		initializeActiveTeachingCall: function (activeTeachingCall) {
			var action = {
				type: INIT_ACTIVE_TEACHING_CALL,
				payload: { 
					activeTeachingCall: activeTeachingCall
				}
			};
			assignmentStateService.reduce(action);
		},
		updateAssignmentsOrder: function (sortedTeachingAssignmentIds, scheduleId) {
			assignmentService.updateAssignmentsOrder(sortedTeachingAssignmentIds, scheduleId).then(function (sortedTeachingAssignmentIds) {
				$rootScope.$emit('toast', {message: "Updated Assignment Priority", type: "SUCCESS"});
				var action = {
					type: UPDATE_TEACHING_ASSIGNMENT_ORDER,
					payload: {
						sortedTeachingAssignmentIds: sortedTeachingAssignmentIds
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addScheduleInstructorNote: function (instructorId, year, workgroupId, comment, assignmentsCompleted) {
			assignmentService.addScheduleInstructorNote(instructorId, year, workgroupId, comment, assignmentsCompleted).then(function (scheduleInstructorNote) {
				$rootScope.$emit('toast', {message: "Added instructor comment", type: "SUCCESS"});
				var action = {
					type: ADD_SCHEDULE_INSTRUCTOR_NOTE,
					payload: {
						scheduleInstructorNote: scheduleInstructorNote
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateScheduleInstructorNote: function (scheduleInstructorNote) {
			assignmentService.updateScheduleInstructorNote(scheduleInstructorNote).then(function (scheduleInstructorNote) {
				$rootScope.$emit('toast', {message: "Updated instructor comment", type: "SUCCESS"});
				var action = {
					type: UPDATE_SCHEDULE_INSTRUCTOR_NOTE,
					payload: {
						scheduleInstructorNote: scheduleInstructorNote
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateTeachingCallResponse: function (teachingCallResponse) {
			assignmentService.updateTeachingCallResponse(teachingCallResponse).then(function (teachingCallResponse) {
				$rootScope.$emit('toast', {message: "Updated availabilities", type: "SUCCESS"});
				var action = {
					type: UPDATE_TEACHING_CALL_RESPONSE,
					payload: {
						teachingCallResponse: teachingCallResponse
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateTeachingCallReceipt: function (teachingCallReceipt) {
			assignmentService.updateTeachingCallReceipt(teachingCallReceipt).then(function (teachingCallReceipt) {
				$rootScope.$emit('toast', {message: "Updated reponse", type: "SUCCESS"});
				var action = {
					type: UPDATE_TEACHING_CALL_RECEIPT,
					payload: {
						teachingCallReceipt: teachingCallReceipt
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addInstructorAssignment: function (instructorId, year, workgroupId, comment) {
			var scheduleInstructorNote = {};
			scheduleInstructorNote.instructorId = instructorId;
			scheduleInstructorNote.comment = comment;

			assignmentService.addScheduleInstructorNote(scheduleInstructorNote).then(function (scheduleInstructorNote) {
				$rootScope.$emit('toast', {message: "Added instructor comment", type: "SUCCESS"});
				var action = {
					type: ADD_SCHEDULE_INSTRUCTOR_NOTE,
					payload: {
						scheduleInstructorNote: scheduleInstructorNote
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		removeInstructorAssignment: function (teachingAssignment) {
			assignmentService.removeInstructorAssignment(sectionGroupId, instructorId).then(function (sectionGroupId) {
				$rootScope.$emit('toast', {message: "Removed instructor from course", type: "SUCCESS"});
				var action = {
					type: REMOVE_TEACHING_ASSIGNMENT,
					payload: {
						sectionGroup: sectionGroup
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addAndApproveInstructorAssignment: function (teachingAssignment, scheduleId) {
			assignmentService.addInstructorAssignment(teachingAssignment, scheduleId).then(function (teachingAssignment) {
				$rootScope.$emit('toast', {message: "Assigned instructor to course", type: "SUCCESS"});
				var action = {
					type: ADD_TEACHING_ASSIGNMENT,
					payload: {
						teachingAssignment: teachingAssignment
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		approveInstructorAssignment: function (teachingAssignment) {
			teachingAssignment.approved = true;

			assignmentService.updateInstructorAssignment(teachingAssignment).then(function (teachingAssignment) {
				$rootScope.$emit('toast', {message: "Assigned instructor to course", type: "SUCCESS"});
				var action = {
					type: UPDATE_TEACHING_ASSIGNMENT,
					payload: {
						teachingAssignment: teachingAssignment
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		unapproveInstructorAssignment: function (originalTeachingAssignment) {
			originalTeachingAssignment.approved = false;
			assignmentService.updateInstructorAssignment(originalTeachingAssignment).then(function (teachingAssignment) {
				$rootScope.$emit('toast', {message: "Removed instructor from course", type: "SUCCESS"});
				// If unapproving a teachingPreference that was not created by the instructor, delete it instead
				if (originalTeachingAssignment.fromInstructor == false && originalTeachingAssignment.approved == false) {
					var action = {
						type: REMOVE_TEACHING_ASSIGNMENT,
						payload: {
							teachingAssignment: originalTeachingAssignment
						}
					};
					assignmentStateService.reduce(action);

				} else {
					var action = {
						type: UPDATE_TEACHING_ASSIGNMENT,
						payload: {
							teachingAssignment: teachingAssignment
						}
					};
					assignmentStateService.reduce(action);
				}
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		updateTeachingCallResponse: function (teachingCallResponse) {
			assignmentService.updateTeachingCallResponse(teachingCallResponse).then(function (teachingCallResponse) {
				$rootScope.$emit('toast', {message: "Updated reponse", type: "SUCCESS"});
				var action = {
					type: UPDATE_TEACHING_CALL_RESPONSE,
					payload: {
						teachingCallResponse: teachingCallResponse
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		addTeachingCallResponse: function (teachingCallResponse) {
			assignmentService.addTeachingCallResponse(teachingCallResponse).then(function (teachingCallResponse) {
				$rootScope.$emit('toast', {message: "Updated response", type: "SUCCESS"});
				var action = {
					type: ADD_TEACHING_CALL_RESPONSE,
					payload: {
						teachingCallResponse: teachingCallResponse
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		createTeachingCall: function (workgroupId, year, teachingCallConfig) {
			assignmentService.createTeachingCall(workgroupId, year, teachingCallConfig).then(function (teachingCall) {
				$rootScope.$emit('toast', {message: "Updated reponse", type: "SUCCESS"});
				var action = {
					type: CREATE_TEACHING_CALL,
					payload: {
						teachingCall: teachingCall
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});
		},
		showCourses: function () {
			var action = {
				type: SWITCH_MAIN_VIEW,
				payload: {
					showInstructors: false,
					showCourses: true
				}
			};
			assignmentStateService.reduce(action);
		},
		showInstructors: function () {
			var action = {
				type: SWITCH_MAIN_VIEW,
				payload: {
					showInstructors: true,
					showCourses: false
				}
			};
			assignmentStateService.reduce(action);
		},
		toggleTermFilter: function (termId) {
			var action = {
				type: TOGGLE_TERM_FILTER,
				payload: {
					termId: termId
				}
			};
			assignmentStateService.reduce(action);
		},
		updateTableFilter: function (query) {
			var action = {
				type: UPDATE_TABLE_FILTER,
				payload: {
					query: query
				}
			};
			assignmentStateService.reduce(action);
		},
		addPreference: function (teachingAssignment) {
			assignmentService.addPreference(teachingAssignment).then(function (teachingAssignments) {
				$rootScope.$emit('toast', {message: "Added Preference", type: "SUCCESS"});
				var action = {
					type: ADD_PREFERENCE,
					payload: {
						teachingAssignments: teachingAssignments
					}
				};
				assignmentStateService.reduce(action);
			}, function (err) {
				$rootScope.$emit('toast', {message: "Something went wrong. Please try again.", type: "ERROR"});
			});	
		},
		removePreference: function(teachingAssignment) {
			assignmentService.removePreference(teachingAssignment).then(function (teachingAssignments) {
				$rootScope.$emit('toast', {message: "Removed Preference", type: "SUCCESS"});
				var action = {
					type: REMOVE_PREFERENCE,
					payload: {
						teachingAssignments: teachingAssignments,
						instructorId: teachingAssignment.instructorId,
						termCode: teachingAssignment.termCode
					}
				};

				assignmentStateService.reduce(action);
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
assignmentApp.factory("assignmentService", this.assignmentService = function($http, $q) {
	return {
		getInitialState: function(workgroupId, year) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/assignmentView/" + workgroupId + "/" + year, { withCredentials: true })
			.success(function(assignmentView) {
				deferred.resolve(assignmentView);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		createTeachingCall: function (workgroupId, year, teachingCallConfig) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/assignmentView/" + workgroupId + "/" + year + "/teachingCalls", teachingCallConfig, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addPreference: function (teachingAssignment) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/assignmentView/preferences/" + teachingAssignment.schedule.id, teachingAssignment, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		removePreference: function (teachingAssignment) {
			var deferred = $q.defer();

			$http.delete(serverRoot + "/api/assignmentView/preferences/" + teachingAssignment.id, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addInstructorAssignment: function (teachingAssignment, scheduleId) {
			var deferred = $q.defer();
			teachingAssignment.termCode = String(teachingAssignment.termCode);
			$http.post(serverRoot + "/api/assignmentView/schedules/" + scheduleId + "/teachingAssignments/", teachingAssignment, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateInstructorAssignment: function (teachingAssignment) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/assignmentView/teachingAssignments/" + teachingAssignment.id, teachingAssignment, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addScheduleInstructorNote: function (instructorId, year, workgroupId, comment, assignmentsCompleted) {
			var deferred = $q.defer();
			var scheduleInstructorNote = {};
			scheduleInstructorNote.instructorComment = comment;
			scheduleInstructorNote.assignmentsCompleted = assignmentsCompleted;

			$http.post(serverRoot + "/api/assignmentView/scheduleInstructorNotes/" + instructorId + "/" + workgroupId + "/" + year, scheduleInstructorNote, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateScheduleInstructorNote: function (scheduleInstructorNote) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/assignmentView/scheduleInstructorNotes/" + scheduleInstructorNote.id, scheduleInstructorNote, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateAssignmentsOrder: function (sortedTeachingAssignmentIds, scheduleId) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/assignmentView/schedules/" + scheduleId + "/teachingAssignments" , sortedTeachingAssignmentIds, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateTeachingCallResponse: function (teachingCallResponse) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/assignmentView/teachingCallResponses/" + teachingCallResponse.id, teachingCallResponse, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		addTeachingCallResponse: function (teachingCallResponse) {
			var deferred = $q.defer();

			$http.post(serverRoot + "/api/assignmentView/teachingCallResponses/" + teachingCallResponse.teachingCallId  + "/" + teachingCallResponse.instructorId, teachingCallResponse, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		updateTeachingCallReceipt: function (teachingCallReceipt) {
			var deferred = $q.defer();

			$http.put(serverRoot + "/api/assignmentView/teachingCallReceipts/" + teachingCallReceipt.id, teachingCallReceipt, { withCredentials: true })
			.success(function(payload) {
				deferred.resolve(payload);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		allTerms: function () {
			var allTerms = {
				'05': 'Summer Session 1',
				'06': 'Summer Special Session',
				'07': 'Summer Session 2',
				'08': 'Summer Quarter',
				'09': 'Fall Semester',
				'10': 'Fall Quarter',
				'01': 'Winter Quarter',
				'02': 'Spring Semester',
				'03': 'Spring Quarter'
			}

			return allTerms;
		}
/*
		getCoursesByWorkgroupIdAndYear: function(workgroupId, year) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/assignmentView/" + workgroupId + "/" + year + "/courses", { withCredentials: true })
			.success(function(courses) {
				deferred.resolve(courses);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		},
		getSectionGroupsByWorkgroupIdAndYear: function(workgroupId, year) {
			var deferred = $q.defer();

			$http.get(serverRoot + "/api/assignmentView/" + workgroupId + "/" + year + "/sectionGroups", { withCredentials: true })
			.success(function(sectionGroups) {
				deferred.resolve(sectionGroups);
			})
			.error(function() {
				deferred.reject();
			});

			return deferred.promise;
		}
*/
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
assignmentApp.service('assignmentStateService', function (
	$rootScope, SectionGroup, Course, ScheduleTermState,
	ScheduleInstructorNote, Term, Instructor, TeachingAssignment,
	TeachingCall, TeachingCallReceipt, TeachingCallResponse) {
	return {
		_state: {},
		_courseReducers: function (action, courses) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					courses = {
						ids: [],
						list: []
					};
					var coursesList = {};
					var length = action.payload.courses ? action.payload.courses.length : 0;
					for (var i = 0; i < length; i++) {
						var course = new Course(action.payload.courses[i]);
						coursesList[course.id] = course;
						coursesList[course.id].isFiltered = false;
						coursesList[course.id].isHidden = isCourseSuppressed(course);
						// Add the termCode:sectionGroupId pairs
						coursesList[course.id].sectionGroupTermCodeIds = {};

						action.payload.sectionGroups
							.filter(function (sectionGroup) {
								return sectionGroup.courseId === course.id
							})
							.forEach(function (sectionGroup) {
								coursesList[course.id].sectionGroupTermCodeIds[sectionGroup.termCode] = sectionGroup.id;
							});
					}
					courses.ids = _array_sortIdsByProperty(coursesList, ["subjectCode", "courseNumber", "sequencePattern"]);
					courses.list = coursesList;
					return courses;
				case UPDATE_TABLE_FILTER:
					var query = action.payload.query;
					for (var i = 0; i < courses.ids.length; i++) {
						var course = courses.list[courses.ids[i]];
						if (searchCourse(course, query)) {
							course.isFiltered = false;
						} else {
							course.isFiltered = true;
						}
					}
					return courses;
				default:
					return courses;
			}
		},
		_teachingAssignmentReducers: function (action, teachingAssignments) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					teachingAssignments = {
						ids: [],
						list: []
					};
					var teachingAssignmentsList = {};
					var length = action.payload.teachingAssignments ? action.payload.teachingAssignments.length : 0;
					for (var i = 0; i < length; i++) {
						var teachingAssignment = new TeachingAssignment(action.payload.teachingAssignments[i]);
						teachingAssignmentsList[teachingAssignment.id] = teachingAssignment;
					}
					teachingAssignments.ids = _array_sortIdsByProperty(teachingAssignmentsList, ["approved"]);
					teachingAssignments.list = teachingAssignmentsList;
					return teachingAssignments;
				case UPDATE_TEACHING_ASSIGNMENT:
					teachingAssignments.list[action.payload.teachingAssignment.id] = action.payload.teachingAssignment;
					return teachingAssignments;
				case ADD_TEACHING_ASSIGNMENT:
					teachingAssignments.list[action.payload.teachingAssignment.id] = action.payload.teachingAssignment;
					teachingAssignments.ids.push(action.payload.teachingAssignment.id);
					return teachingAssignments;
				case ADD_PREFERENCE:
					// Add a group of teachingAssignments created from a preference
					var payloadTeachingAssignments = action.payload.teachingAssignments;
					for (var i = 0; i < payloadTeachingAssignments.length; i++) {
						var slotTeachingAssignment = payloadTeachingAssignments[i];
						teachingAssignments.list[slotTeachingAssignment.id] = slotTeachingAssignment;
						teachingAssignments.ids.push(slotTeachingAssignment.id);
					}
					return teachingAssignments;
				case REMOVE_PREFERENCE:
					var payloadTeachingAssignments = action.payload.teachingAssignments;
					var termCode = action.payload.termCode;
					// For each teachingAssignment associated to that preference
					for (var i = 0; i < payloadTeachingAssignments.length; i++) {
						var slotTeachingAssignment = payloadTeachingAssignments[i];
						// Remove reference from ids
						var index = teachingAssignments.ids.indexOf(slotTeachingAssignment.id);
						if (index > -1) {
							teachingAssignments.ids.splice(index, 1);
						}
						// Remove reference from list
						delete teachingAssignments.list[slotTeachingAssignment.id];
					}
					return teachingAssignments;
				case REMOVE_TEACHING_ASSIGNMENT:
					var index = teachingAssignments.ids.indexOf(action.payload.teachingAssignment.id);
					if (index > -1) {
						teachingAssignments.ids.splice(index, 1);
					}
					return teachingAssignments;
				default:
					return teachingAssignments;
			}
		},
		_teachingCallReducers: function (action, teachingCalls) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					teachingCalls = {
						ids: [],
						list: [],
						eligibleGroups: {}
					};
					teachingCalls.eligibleGroups.senateInstructors = true;
					teachingCalls.eligibleGroups.federationInstructors = true;
					
					var teachingCallsList = {};
					var length = action.payload.teachingCalls ? action.payload.teachingCalls.length : 0;
					for (var i = 0; i < length; i++) {
						var teachingCall = new TeachingCall(action.payload.teachingCalls[i]);
						teachingCallsList[teachingCall.id] = teachingCall;

						// Gather eligible group data
						if (teachingCall.sentToSenate) {
							teachingCalls.eligibleGroups.senateInstructors = false;
						}
						if (teachingCall.sentToFederation) {
							teachingCalls.eligibleGroups.federationInstructors = false;
						}

					}
					teachingCalls.ids = _array_sortIdsByProperty(teachingCallsList, ["id"]);
					teachingCalls.list = teachingCallsList;
					return teachingCalls;
				case CREATE_TEACHING_CALL:
					var teachingCall = action.payload.teachingCall;

					if (teachingCall.sentToFederation) {
						teachingCalls.eligibleGroups.federationInstructors = false;
					}
					if (teachingCall.sentToSenate) {
						teachingCalls.eligibleGroups.senateInstructors = false;
					}

					teachingCalls.list[teachingCall.id] = teachingCall;
					teachingCalls.ids.push(teachingCall.id);
					return teachingCalls;
				default:
					return teachingCalls;
			}
		},
		_activeTeachingCallReducers: function (action, state) {
			activeTeachingCall = state.activeTeachingCall;
			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					payloadActiveTeachingCall = action.payload.activeTeachingCall;
					return payloadActiveTeachingCall;
				case INIT_ACTIVE_TEACHING_CALL:
					payloadActiveTeachingCall = action.payload.activeTeachingCall;
					activeTeachingCall = payloadActiveTeachingCall;
					return activeTeachingCall;
				case ADD_PREFERENCE:
					payloadTeachingAssignments = action.payload.teachingAssignments;

					for (var i = 0; i < payloadTeachingAssignments.length; i++) {
						var teachingAssignment = payloadTeachingAssignments[i];
						var sectionGroup = state.sectionGroups.list[teachingAssignment.sectionGroupId];
						var course = state.courses.list[sectionGroup.courseId];
						var termCode = parseInt(teachingAssignment.termCode);

						teachingAssignment.subjectCode = course.subjectCode;
						teachingAssignment.courseNumber = course.courseNumber;

						if (activeTeachingCall.termAssignments[teachingAssignment.termCode] == null) {
							activeTeachingCall.termAssignments[teachingAssignment.termCode] = [];
						};

						activeTeachingCall.termAssignments[teachingAssignment.termCode].push(teachingAssignment);

						for (var j = 0; j < activeTeachingCall.scheduledCourses[teachingAssignment.termCode].length; j++) {
							slotCourse = activeTeachingCall.scheduledCourses[teachingAssignment.termCode][j];
							if (slotCourse.id == course.id) {
								slotCourse.hasPreference = true;
							}
						}
					}
					return activeTeachingCall;
				case REMOVE_PREFERENCE:
					if (activeTeachingCall == null) {
						return activeTeachingCall;
					}
					var teachingAssignments = action.payload.teachingAssignments;
					var termCode = action.payload.termCode;
					var DTOinstructorId = action.payload.instructorId;
					for (var i = 0; i < teachingAssignments.length; i++) {
						var slotTeachingAssignment = teachingAssignments[i];
						var index = -1;
						for (var j = 0; j < activeTeachingCall.termAssignments[termCode].length; j++) {
								if (activeTeachingCall.termAssignments[termCode][j].id == slotTeachingAssignment.id) {
									var index = j;
									break;
								}
						}
						if (index > -1) {
							activeTeachingCall.termAssignments[termCode].splice(index, 1);
						}

						for (var k = 0; k < activeTeachingCall.scheduledCourses[termCode].length; k++) {
							slotCourse = activeTeachingCall.scheduledCourses[termCode][k];
							if (slotTeachingAssignment.sectionGroupId == slotCourse.sectionGroupTermCodeIds[termCode]) {
								slotCourse.hasPreference = false;
							}
						}
					}

					return activeTeachingCall;
				default:
					return activeTeachingCall;
			}
		},
		_teachingCallReceiptReducers: function (action, teachingCallReceipts) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					teachingCallReceipts = {
						ids: [],
						list: []
					};
					
					var teachingCallReceiptsList = {};
					var length = action.payload.teachingCallReceipts ? action.payload.teachingCallReceipts.length : 0;
					for (var i = 0; i < length; i++) {
						var teachingCallReceipt = new TeachingCallReceipt(action.payload.teachingCallReceipts[i]);
						teachingCallReceiptsList[teachingCallReceipt.id] = teachingCallReceipt;
					}
					teachingCallReceipts.ids = _array_sortIdsByProperty(teachingCallReceiptsList, ["id"]);
					teachingCallReceipts.list = teachingCallReceiptsList;
					return teachingCallReceipts;
				case UPDATE_TEACHING_CALL_RECEIPT:
					teachingCallReceipts.list[action.payload.teachingCallReceipt.id] = action.payload.teachingCallReceipt;
					return teachingCallReceipts;
				default:
					return teachingCallReceipts;
			}
		},
		_teachingCallResponseReducers: function (action, teachingCallResponses) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					teachingCallResponses = {
						ids: [],
						list: []
					};
					
					var teachingCallResponsesList = {};
					var length = action.payload.teachingCallResponses ? action.payload.teachingCallResponses.length : 0;
					for (var i = 0; i < length; i++) {
						var teachingCallResponse = new TeachingCallResponse(action.payload.teachingCallResponses[i]);
						teachingCallResponsesList[teachingCallResponse.id] = teachingCallResponse;
					}
					teachingCallResponses.ids = _array_sortIdsByProperty(teachingCallResponsesList, ["id"]);
					teachingCallResponses.list = teachingCallResponsesList;
					return teachingCallResponses;
				case UPDATE_TEACHING_CALL_RESPONSE:
					teachingCallResponses.list[action.payload.teachingCallResponse.id] = action.payload.teachingCallResponse;
					return teachingCallResponses;
				default:
					return teachingCallResponses;
			}
		},
		_instructorReducers: function (action, instructors) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					instructors = {
						ids: [],
						list: []
					};
					var instructorsList = {};
					var length = action.payload.instructors ? action.payload.instructors.length : 0;
					
					// Loop over instructors
					for (var i = 0; i < length; i++) {
						var instructor = new Instructor(action.payload.instructors[i]);
						instructor.teachingAssignmentTermCodeIds = {};
						instructor.isFiltered = false;

						// Create arrays of teachingAssignmentIds for each termCode
						for (var j = 0; j < action.payload.scheduleTermStates.length; j++) {
							var termCode = action.payload.scheduleTermStates[j].termCode;
							instructor.teachingAssignmentTermCodeIds[termCode] = [];

							// Create array of teachingAssignmentIds that are associated to this termCode and instructor
							action.payload.teachingAssignments
								.filter(function (teachingAssignment) {
									return (teachingAssignment.instructorId === instructor.id && teachingAssignment.termCode === termCode)
								})
								.forEach(function (teachingAssignment) {
									instructor.teachingAssignmentTermCodeIds[termCode].push(teachingAssignment.id);
								});
						}

						// Create arrays of teachingCallResponseIds
						instructor.teachingCallResponses = [];

						for (var j = 0; j < action.payload.teachingCallResponses.length; j++) {
							var teachingCallResponse = action.payload.teachingCallResponses[j];
							if (teachingCallResponse.instructorId == instructor.id) {
								instructor.teachingCallResponses.push(teachingCallResponse);
							}
						}

						// Find scheduleInstructorNote associated to this instructor, if it exists
						instructor.scheduleInstructorNoteId = null;
						for (var j = 0; j < action.payload.scheduleInstructorNotes.length; j++) {
							var scheduleInstructorNote = action.payload.scheduleInstructorNotes[j];
							if (scheduleInstructorNote.instructorId == instructor.id) {
								instructor.scheduleInstructorNoteId = scheduleInstructorNote.id;
							}
						}

						// Find teachingCallReceipt associated to this instructor, if it exists
						instructor.teachingCallReceiptId = null;
						for (var j = 0; j < action.payload.teachingCallReceipts.length; j++) {
							var teachingCallReceipt = action.payload.teachingCallReceipts[j];
							if (teachingCallReceipt.instructorId == instructor.id) {
								instructor.teachingCallReceiptId = teachingCallReceipt.id;
							}
						}

						instructorsList[instructor.id] = instructor;
					}
					instructors.ids = _array_sortIdsByProperty(instructorsList, ["lastName"]);
					instructors.list = instructorsList;
					return instructors;
				case UPDATE_TABLE_FILTER:
					var query = action.payload.query;
					for (var i = 0; i < instructors.ids.length; i++) {
						var instructor = instructors.list[instructors.ids[i]];
						if (searchInstructor(instructor, query)) {
							instructor.isFiltered = false;
						} else {
							instructor.isFiltered = true;
						}
					}
					return instructors;
				case ADD_SCHEDULE_INSTRUCTOR_NOTE:
					var scheduleInstructorNote = action.payload.scheduleInstructorNote;
					for (var i = 0; i < instructors.ids.length; i++) {
						var instructor = instructors.list[instructors.ids[i]];
						if (instructor.id == scheduleInstructorNote.instructorId) {
							instructor.scheduleInstructorNoteId = scheduleInstructorNote.id;
						}
					}
					return instructors;
				case ADD_TEACHING_ASSIGNMENT:
					var teachingAssignment = action.payload.teachingAssignment;
					var instructor = instructors.list[teachingAssignment.instructorId];
					instructor.teachingAssignmentTermCodeIds[teachingAssignment.termCode].push(teachingAssignment.id);
					return instructors;
				case ADD_PREFERENCE:
					var teachingAssignments = action.payload.teachingAssignments;
					for (var i = 0; i < teachingAssignments.length; i++) {
						var slotTeachingAssignment = teachingAssignments[i];
						var instructor = instructors.list[slotTeachingAssignment.instructorId];
						instructor.teachingAssignmentTermCodeIds[slotTeachingAssignment.termCode].push(slotTeachingAssignment.id);
					}
					return instructors;
				case REMOVE_PREFERENCE:
					var teachingAssignments = action.payload.teachingAssignments;
					var termCode = action.payload.termCode;
					var DTOinstructorId = action.payload.instructorId;
					var instructor = instructors.list[DTOinstructorId];
					var instructorTeachingAssignments = instructor.teachingAssignmentTermCodeIds[termCode];
					for (var i = 0; i < teachingAssignments.length; i++) {
						var slotTeachingAssignment = teachingAssignments[i];
						var index = instructorTeachingAssignments.indexOf(slotTeachingAssignment.id);
						if (index > -1) {
							instructorTeachingAssignments.splice(index, 1);
						}
					}
					return instructors;
				case REMOVE_TEACHING_ASSIGNMENT:
					var teachingAssignment = action.payload.teachingAssignment;
					var instructor = instructors.list[teachingAssignment.instructorId];
					for (var i = 0; i < instructor.teachingAssignmentTermCodeIds[action.payload.teachingAssignment.termCode].length; i++) {
							var slotTeachingAssignmentId = instructor.teachingAssignmentTermCodeIds[action.payload.teachingAssignment.termCode][i];
						if (slotTeachingAssignmentId == teachingAssignment.id) {
							instructor.teachingAssignmentTermCodeIds[action.payload.teachingAssignment.termCode].splice(i);
							return instructors;
						}
					}
					return instructors;
				default:
					return instructors;
			}
		},
		_scheduleTermStateReducers: function (action, scheduleTermStates) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					scheduleTermStates = {
						ids: []
					};
					var scheduleTermStateList = {};
					var length = action.payload.scheduleTermStates ? action.payload.scheduleTermStates.length : 0;
					for (var i = 0; i < length; i++) {
						var scheduleTermStateData = action.payload.scheduleTermStates[i];
						// Using termCode as key since the scheduleTermState does not have an id
						scheduleTermStateList[scheduleTermStateData.termCode] = new ScheduleTermState(scheduleTermStateData);
					}
					scheduleTermStates.ids = _array_sortIdsByProperty(scheduleTermStateList, "termCode");
					scheduleTermStates.list = scheduleTermStateList;
					return scheduleTermStates;
				default:
					return scheduleTermStates;
			}
		},
		_scheduleInstructorNoteReducers: function (action, scheduleInstructorNotes) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					scheduleInstructorNotes = {
						ids: [],
						list: []
					};
					var scheduleInstructorNotesList = {};
					var length = action.payload.scheduleInstructorNotes ? action.payload.scheduleInstructorNotes.length : 0;
					for (var i = 0; i < length; i++) {
						var scheduleInstructorNote = new ScheduleInstructorNote(action.payload.scheduleInstructorNotes[i]);
						scheduleInstructorNotesList[scheduleInstructorNote.id] = scheduleInstructorNote;
					}
					scheduleInstructorNotes.ids = _array_sortIdsByProperty(scheduleInstructorNotesList, ["id"]);
					scheduleInstructorNotes.list = scheduleInstructorNotesList;
					return scheduleInstructorNotes;
				case UPDATE_SCHEDULE_INSTRUCTOR_NOTE:
					scheduleInstructorNotes.list[action.payload.scheduleInstructorNote.id] = action.payload.scheduleInstructorNote;
					return scheduleInstructorNotes;
				case ADD_SCHEDULE_INSTRUCTOR_NOTE:
					scheduleInstructorNotes.list[action.payload.scheduleInstructorNote.id] = action.payload.scheduleInstructorNote;
					scheduleInstructorNotes.ids.push(action.payload.scheduleInstructorNote.id);
					return scheduleInstructorNotes;
				default:
					return scheduleInstructorNotes;
			}
		},
		_sectionGroupReducers: function (action, sectionGroups) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					sectionGroups = {
						newSectionGroup: {},
						ids: []
					};
					
					var sectionGroupsList = {};

					var length = action.payload.sectionGroups ? action.payload.sectionGroups.length : 0;
					for (var i = 0; i < length; i++) {
						var sectionGroup = new SectionGroup(action.payload.sectionGroups[i]);
						sectionGroupsList[sectionGroup.id] = sectionGroup;
						sectionGroups.ids.push(sectionGroup.id);

						// Create a list of teachingAssignmentIds that are associated to this sectionGroup
						sectionGroupsList[sectionGroup.id].teachingAssignmentIds = [];
						action.payload.teachingAssignments
							.filter(function (teachingAssignment) {
								return teachingAssignment.sectionGroupId === sectionGroup.id
							})
							.forEach(function (teachingAssignment) {
								sectionGroupsList[sectionGroup.id].teachingAssignmentIds.push(teachingAssignment.id);
							});
					}

					sectionGroups.list = sectionGroupsList;
					return sectionGroups;
				case ADD_TEACHING_ASSIGNMENT:
					var teachingAssignment = action.payload.teachingAssignment;
					var sectionGroup = {};
					if (teachingAssignment.sectionGroupId) {
						sectionGroup = sectionGroups.list[teachingAssignment.sectionGroupId];
						sectionGroup.teachingAssignmentIds.push(teachingAssignment.id);
					}
					return sectionGroups;
				case ADD_PREFERENCE:
					var payloadTeachingAssignments = action.payload.teachingAssignments;
					for (var i = 0; i < payloadTeachingAssignments.length; i++) {
						var slotTeachingAssignment = payloadTeachingAssignments[i];
						var sectionGroup = {};
						if (slotTeachingAssignment.sectionGroupId) {
							sectionGroup = sectionGroups.list[slotTeachingAssignment.sectionGroupId];
							sectionGroup.teachingAssignmentIds.push(slotTeachingAssignment.id);
						}
					}
					return sectionGroups;
				case REMOVE_PREFERENCE:
					var teachingAssignments = action.payload.teachingAssignments;
					var DTOtermCode = action.payload.termCode;
					var DTOinstructorId = action.payload.instructorId;
					for (var i = 0; i < teachingAssignments.length; i++) {
						var slotTeachingAssignment = teachingAssignments[i];
						var sectionGroup = sectionGroups.list[slotTeachingAssignment.sectionGroupId];
						var index = sectionGroup.teachingAssignmentIds.indexOf(slotTeachingAssignment.id);
						if (index > -1) {
							sectionGroup.teachingAssignmentIds.splice(index, 1);
						}
					}
					return sectionGroups;
				case REMOVE_TEACHING_ASSIGNMENT:
					var teachingAssignment = action.payload.teachingAssignment;
					var sectionGroup = sectionGroups.list[teachingAssignment.sectionGroupId];
					if (sectionGroup) {
						var index = sectionGroup.teachingAssignmentIds.indexOf(teachingAssignment.id);
						if (index > -1) {
							sectionGroup.teachingAssignmentIds.splice(index, 1);
						}
					}
					return sectionGroups;
				default:
					return sectionGroups;
			}
		},
		_userInterfaceReducers: function (action, userInterface) {
			var scope = this;

			switch (action.type) {
				case INIT_ASSIGNMENT_VIEW:
					var userInterface = {};

					userInterface.instructorId = action.payload.instructorId;
					userInterface.userId = action.payload.userId;

					userInterface.federationInstructorIds = action.payload.federationInstructorIds;
					userInterface.senateInstructorIds = action.payload.senateInstructorIds;
					userInterface.scheduleId = action.payload.scheduleId;

					userInterface.showInstructors = false;
					userInterface.showCourses = true;
					// Set default enabledTerms based on scheduleTermState data
					var enabledTerms = {};
					enabledTerms.list = {};
					enabledTerms.ids = [];
					for (var i = 0; i < action.payload.scheduleTermStates.length; i++) {
						var term = action.payload.scheduleTermStates[i].termCode;
						// Generate an id based off termCode
						var id = Number(term.slice(-2));
						enabledTerms.ids.push(id);
					}

					enabledTerms.ids = orderTermsChronologically(enabledTerms.ids);

					// Generate termCode list entries
					for (var i = 1; i < 11; i++) {
						// 4 is not used as a termCode
						if (i != 4) {
							var termCode = generateTermCode(action.year, i)
							enabledTerms.list[i] = termCode;
						}
					}

					userInterface.enabledTerms = enabledTerms;

					return userInterface;
				case SWITCH_MAIN_VIEW:
					userInterface.showCourses = action.payload.showCourses;
					userInterface.showInstructors = action.payload.showInstructors;
					return userInterface;
				case TOGGLE_TERM_FILTER:
					var termId = action.payload.termId;
					var idx = userInterface.enabledTerms.ids.indexOf(termId);
					// A term in the term filter dropdown has been toggled on or off.
					if(idx === -1) {
						// Toggle on
						userInterface.enabledTerms.ids.push(termId);
						userInterface.enabledTerms.ids = orderTermsChronologically(userInterface.enabledTerms.ids);
					} else {
						// Toggle off
						userInterface.enabledTerms.ids.splice(idx, 1);
					}
					return userInterface;
				default:
					return userInterface;
			}
		},
		reduce: function (action) {
			var scope = this;

			if (!action || !action.type) {
				return;
			}

			newState = {};
			newState.scheduleTermStates = scope._scheduleTermStateReducers(action, scope._state.scheduleTermStates);
			newState.courses = scope._courseReducers(action, scope._state.courses);
			newState.sectionGroups = scope._sectionGroupReducers(action, scope._state.sectionGroups);
			newState.instructors = scope._instructorReducers(action, scope._state.instructors);
			newState.teachingAssignments = scope._teachingAssignmentReducers(action, scope._state.teachingAssignments);
			newState.teachingCallReceipts = scope._teachingCallReceiptReducers(action, scope._state.teachingCallReceipts);
			newState.teachingCallResponses = scope._teachingCallResponseReducers(action, scope._state.teachingCallResponses);
			newState.teachingCalls = scope._teachingCallReducers(action, scope._state.teachingCalls);
			newState.scheduleInstructorNotes = scope._scheduleInstructorNoteReducers(action, scope._state.scheduleInstructorNotes);
			newState.userInterface = scope._userInterfaceReducers(action, scope._state.userInterface);
			newState.teachingCalls = scope._teachingCallReducers(action, scope._state.teachingCalls);
			newState.activeTeachingCall = scope._activeTeachingCallReducers(action, scope._state);

			scope._state = newState;

			$rootScope.$emit('assignmentStateChanged',scope._state);
		}
	}
});

// Returns false if course is a x98 or x99 series, unless the user has opted to show them
isCourseSuppressed = function(course) {
	// TODO: implement this check once toggle is added
	// if (suppressingDoNotPrint == false) { return false;}

	// HardCoded courses that are suppressed
	var suppressedCourseNumbers = ["194HA", "194HB", "197T", "201"];
	if (suppressedCourseNumbers.indexOf(course.courseNumber) > -1) {
		return true;
	}	

	var lastChar = course.courseNumber.charAt(course.courseNumber.length-1);
	var secondLastChar = course.courseNumber.charAt(course.courseNumber.length-2);
	var thirdLastChar = course.courseNumber.charAt(course.courseNumber.length-3);
	
	// Filter out courses like 299H
	if (isLetter(lastChar)) {
		if (thirdLastChar == 9 && (secondLastChar == 8 || secondLastChar == 9)) {
			return true;
		}
	} else {
		if (secondLastChar == 9 && (lastChar == 8 || lastChar == 9)) {
			return true;
		}
	}

	return false;
}

generateTermCode = function(year, term) {
	if (term.toString().length == 1) {
		term = "0" + Number(term);
	}

	switch(term) {
		case "01":
		case "02":
		case "03":
			year++;
			break;
		default:
			year;
	}
	var termCode = year + term;

	return termCode;
}

// Sorts a list of termIds into chronological order
orderTermsChronologically = function(terms) {
	var orderedTermsReference = [5,6,7,8,9,10,1,2,3];
	terms.sort(function(a,b) {
		if (orderedTermsReference.indexOf(a) > orderedTermsReference.indexOf(b)) {
			return 1;
		}
		return -1;
	});

	return terms;
}

searchCourse = function(course, query) {
	query = query.toLowerCase();

	if (course.subjectCode.toLowerCase().search(query) >= 0
		|| course.courseNumber.toLowerCase().search(query) >= 0
		|| course.title.toLowerCase().search(query) >= 0) {
		return true;
	}

	return false;
}

searchInstructor = function(user, query) {
	query = query.toLowerCase();

	if (user.fullName.toLowerCase().search(query) >= 0) {
		return true;
	}

	return false;
}