// TODO: Rename to _array_getElementById
_array_findById = function(arr, id) {
	var index = _array_getIndexById(arr, id);

	if (index == -1) {
		return undefined;
	}

	return arr[index];
}

_array_getIndexById = function (arr, id) {
	return arr.findIndex( function(n) {
		return n.id == id;
	});
}

/**
 * Returns a sorted array of Ids based on the value of a
 * property in a corresponding object of objects (listHash).
 *
 * Example:
 * listHash = { 1: {name: "Chris"}, 2: {name: "Adam"}, 3: {name: "Bob"} };
 * properties = "name"
 * Returns ==> [2, 3, 1]
 *
 * @param {object of objects} listHash - An object of which the keys are the ids of its objects.
 * @param {string or array of strings} properties - The property/properties that the sorter will be comparing.
 * @returns {array} The sorted array
 */
_array_sortIdsByProperty = function (listHash, properties) {
	var keys = Object.keys(listHash);
	return keys.sort(function (a, b) {
		// Construct the comparator value by concatinating property values if the properties were passed as an array
		if (properties.constructor === Array) {
			var valA = "";
			var valB = "";
			for (i in properties) {
				valA += listHash[a][properties[i]];
				valB += listHash[b][properties[i]];
			}
		} else {
			// This will accept a single property in the form of a string
			var valA = listHash[a][properties];
			var valB = listHash[b][properties];
		}

		// If the properties are strings, ignore the case
		if (typeof valA == "string") { valA = valA.toUpperCase(); }
		if (typeof valB == "string") { valB = valB.toUpperCase(); }

		if (valA < valB) { return -1; }
		if (valA > valB) { return 1; }
		return 0;
	}).map(function(id) { return parseInt(id); });
}
//Merges properties of 'other' into 'self'
_object_merge = function(self, other) {
	for (var key in other) {
		// hasOwnProperty() allows us to avoid copying prototype properties
		if (other.hasOwnProperty(key)) {
			self[key] = other[key];
		}
	}

	return self;
}

// Empties object without loosing reference
_object_clear = function(self) {
	for (var key in self) {
		// hasOwnProperty() allows us to avoid copying prototype properties
		if (self.hasOwnProperty(key)) {
			delete self[key];
		}
	}

	return self;
}

// Returns false on null, undefined, zero characters, or only whitespace
String.prototype.isEmpty = function() {
	return (!this || this.length === 0 || !this.trim() );
};

// Returns the appropriate suffix, e.g. 1st, 2nd, 3rd, 4th, etc.
String.prototype.appendOrdinalSuffix = function() {
	var j = this % 10, k = this % 100;

	if (j == 1 && k != 11) {
		return this + "st";
	}
	if (j == 2 && k != 12) {
		return this + "nd";
	}
	if (j == 3 && k != 13) {
		return this + "rd";
	}
	return this + "th";
};

// Removes leading zeroes from a number
String.prototype.toNumber = function() {
	return Number(this).toString();
};

// Converts 24 'military time' to 12 hour am/pm time
String.prototype.toStandardTime = function () {
	//If time is already in standard time then don't format.
	if(this.indexOf('AM') > -1 || this.indexOf('PM') > -1) {
		return this;
	} else {
			//If value is the expected length for military time then process to standard time.
		if(this.length == 8) {
			var hour = this.substring ( 0,2 ); //Extract hour
			var minutes = this.substring ( 3,5 ); //Extract minutes
			var identifier = 'AM'; //Initialize AM PM identifier

			if(hour == 12){ //If hour is 12 then should set AM PM identifier to PM
				identifier = 'PM';
			}
			if(hour == 0){ //If hour is 0 then set to 12 for standard time 12 AM
				hour=12;
			}
			if(hour > 12){ //If hour is greater than 12 then convert to standard 12 hour format and set the AM PM identifier to PM
				hour = hour - 12;
				identifier='PM';
			}
			return hour + ':' + minutes + ' ' + identifier; //Return the constructed standard time
		} else { //If value is not the expected length than just return the value as is
			return this;
		}
	}
};

/**
 * Returns the registrar's name for the term code
 * Example: 201610 -> 2016 Fall Quarter
 *
 * @params [optional] excludeYear
 */
String.prototype.getTermCodeDisplayName = function (excludeYear) {
	if (this.length != 6) return "";

	var year = this.substr(0, 4);
	var code = this.slice(-2);

	var _allTerms = {
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

	var description = excludeYear ? "" : year + ' ';
	description += _allTerms[code];
	return description;
};

// Credit: http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
// isNumber ('123'); // true  
// isNumber (5); // true  
// isNumber ('q345'); // false
// isNumber(null); // false
// isNumber(undefined); // false
// isNumber(false); // false
// isNumber('   '); // false
function isNumber(obj) { return ! isNaN (obj-0) && obj !== null && obj !== "" && obj !== false; }

function isLetter(c) {
  return c.toLowerCase() != c.toUpperCase();
}

angular.module('activity', [])

.factory('Activity', ['$http', function($http) {
	function Activity(activityData) {
		if (activityData) {
			this.setData(activityData);
			this.updateCalculatedProperties();
		}
	};
	Activity.prototype = {
		setData: function(activityData) {
			angular.extend(this, activityData);
		},
		updateCalculatedProperties: function () {
			this.setStandardTimes();
			this.setBannerRoom();
			this.setSelectedDuration();
		},
		/**
		 * Returns the human readable code description
		 */
		getCodeDescription: function () {
			var codeDescriptions = {
				'%': "World Wide Web Electronic Discussion",
				'0': "World Wide Web Virtual Lecture",
				'1': "Conference",
				'2': "Term Paper/Discussion",
				'3': "Film Viewing",
				'6': "Dummy Course",
				'7': "Combined Schedule",
				'8': "Project",
				'9': "Extensive Writing or Discussion",
				'A': "Lecture",
				'B': "Lecture/Discussion",
				'C': "Laboratory",
				'D': "Discussion",
				'E': "Seminar",
				'F': "Fieldwork",
				'G': "Discussion/Laboratory",
				'H': "Laboratory/Discussion",
				'I': "Internship",
				'J': "Independent Study",
				'K': "Workshop",
				'L': "Lecture/Lab",
				'O': "Clinic",
				'P': "PE Activity",
				'Q': "Listening",
				'R': "Recitation",
				'S': "Studio",
				'T': "Tutorial",
				'U': "Auto Tutorial",
				'V': "Variable",
				'W': "Practice",
				'X': "Performance Instruction",
				'Y': "Rehearsal",
				'Z': "Term Paper"
			};
			return codeDescriptions[this.activityTypeCode.activityTypeCode];
		},
		getStandardTimes: function () {
			return {
				50: {
					dayIndicators: ['0101000', '0010100', '0101010', '0111100', '0111010'],
					times: [
						{ start: '08:00:00', end: '08:50:00' },
						{ start: '09:00:00', end: '09:50:00' },
						{ start: '10:00:00', end: '10:50:00' },
						{ start: '11:00:00', end: '11:50:00' },
						{ start: '12:10:00', end: '13:00:00' },
						{ start: '13:10:00', end: '14:00:00' },
						{ start: '14:10:00', end: '15:00:00' },
						{ start: '15:10:00', end: '16:00:00' },
						{ start: '16:10:00', end: '17:00:00' },
						{ start: '17:10:00', end: '18:00:00' },
						{ start: '18:10:00', end: '19:00:00' },
						{ start: '19:10:00', end: '20:00:00' },
						{ start: '20:10:00', end: '21:00:00' },
						{ start: '21:10:00', end: '22:00:00' }
					]
				},
				80: {
					dayIndicators: ['0010100'],
					times: [
						{ start: '07:30:00', end: '08:50:00' },
						{ start: '09:00:00', end: '10:20:00' },
						{ start: '10:30:00', end: '11:50:00' },
						{ start: '12:10:00', end: '13:30:00' },
						{ start: '12:10:00', end: '13:30:00' },
						{ start: '13:40:00', end: '15:00:00' },
						{ start: '15:10:00', end: '16:30:00' },
						{ start: '16:40:00', end: '18:00:00' },
						{ start: '18:10:00', end: '19:30:00' },
						{ start: '19:40:00', end: '21:00:00' }
					]
				},
				110: {
					dayIndicators: ['0101000', '0010100'],
					times: [
						{ start: '08:00:00', end: '09:50:00' },
						{ start: '10:00:00', end: '11:50:00' },
						{ start: '12:10:00', end: '14:00:00' },
						{ start: '14:10:00', end: '16:00:00' },
						{ start: '16:10:00', end: '18:00:00' },
						{ start: '18:10:00', end: '20:00:00' },
						{ start: '20:10:00', end: '22:00:00' }
					]
				}
			};
		},
		getMeridianTime: function(time) {
			if (!time) {
				return {hours: '--', minutes: '--', meridian: '--'};
			}

			var timeArr = time.split(':');

			var hours = parseInt(timeArr[0]);
			if (hours === 0) hours = 12;
			else if (hours > 12) hours = hours % 12;

			var minutes = parseInt(timeArr[1]);
			var meridian = timeArr[0] < 12 ? 'AM' : 'PM';

			return {hours: hours, minutes: minutes, meridian: meridian};
		},
		/**
		 * Sets the 'isStandardTimes' property on the activity if the times match
		 * one of the registrar's standard time patterns'
		 */
		setStandardTimes: function () {
			standardTimePatterns = this.getStandardTimes();

			if (parseInt(this.frequency) !== 1 || !this.startTime || !this.endTime) {
				this.isStandardTimes = false;
				return;
			}

			// Get time difference in minutes
			var start = this.startTime.split(':').map(Number);
			var end = this.endTime.split(':').map(Number);
			var timeDiff = (end[0] - start[0]) * 60 + (end[1] - start[1]);

			var pattern = standardTimePatterns[timeDiff] || {dayIndicators: []};
			var isStandard = false;

			outerloop:
			for (var d = 0; d < pattern.dayIndicators.length; d++) {
				if (pattern.dayIndicators[d] === this.dayIndicator){
					for (var t = 0; t < pattern.times.length; t++) {
						if(pattern.times[t].start === this.startTime && pattern.times[t].end === this.endTime) {
							isStandard = true;
							break outerloop;
						}
					}
				}
			}

			this.isStandardTimes = isStandard;
		},
		/**
		 * Sets the 'isBannerRoom' to true if location is null and the activity is not virtual
		 */
		setBannerRoom: function () {
			this.isBannerRoom = !this.locationId && !this.virtual;
		},
		setSelectedDuration: function () {
			var start = moment(this.startTime, "HH:mm:ss");
			var end = moment(this.endTime, "HH:mm:ss");
			var duration = moment.duration(end.diff(start));
			this.selectedDuration = duration.asMinutes().toString();
		}
	};
	return Activity;
}]);

angular.module('building', [])

.factory('Building', ['$http', function($http) {
	function Building(buildingData) {
		if (buildingData) {
			this.setData(buildingData);
		}
	};
	Building.prototype = {
			setData: function(buildingData) {
				angular.extend(this, buildingData);
			}
	};
	return Building;
}]);

angular.module('course', [])

.factory('Course', ['$http', function($http) {
	function Course(courseData) {
		this.tagIds = [];
		if (courseData) {
			this.setData(courseData);
		}
	};
	Course.prototype = {
		setData: function(courseData) {
			angular.extend(this, courseData);
		},
		isSeries: function () {
			return this.sequencePattern.toLowerCase() != this.sequencePattern.toUpperCase();
		}
	};
	return Course;
}]);

angular.module('courseOffering', [])

.factory('CourseOffering', ['$http', function($http) {
	function CourseOffering(courseOfferingData) {
		if (courseOfferingData) {
			this.setData(courseOfferingData);
		}
	};
	CourseOffering.prototype = {
			setData: function(courseOfferingData) {
				angular.extend(this, courseOfferingData);
			}
	};
	return CourseOffering;
}]);

angular.module('courseOfferingGroup', [])

.factory('CourseOfferingGroup', ['$http', function($http) {
	function CourseOfferingGroup(cogData) {
		if (cogData) {
			this.setData(cogData);
		}
	};
	CourseOfferingGroup.prototype = {
			setData: function(cogData) {
				angular.extend(this, cogData);
			}
	};
	return CourseOfferingGroup;
}]);

angular.module('instructor', [])

.factory('Instructor', ['$http', function($http) {
	function Instructor(instructorData) {
		if (instructorData) {
			this.setData(instructorData);
		}
	};
	Instructor.prototype = {
			setData: function(instructorData) {
				angular.extend(this, instructorData);
			}
	};
	return Instructor;
}]);

angular.module('location', [])

.factory('Location', ['$http', function($http) {
	function Location(locationData) {
		if (locationData) {
			this.setData(locationData);
		}
	};
	Location.prototype = {
			setData: function(locationData) {
				angular.extend(this, locationData);
			}
	};
	return Location;
}]);

/**
 * Role is the frontend model of a user's role, used on the
 * Workgroup Configuration page and possibly elsewhere.
 */

angular.module('role', [])

.factory('Role', ['$http', function($http) {
	function Role(roleData) {
		if (roleData) {
			this.setData(roleData);
		}
	};
	Role.prototype = {
			setData: function(roleData) {
				angular.extend(this, roleData);
			},
			getDisplayName : function() {
				if (typeof this.name !== 'string') return "";

				var lowercase = this.name.replace( /([A-Z])/g, " $1" );
				return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
			}
	};
	return Role;
}]);

angular.module('schedule', [])

.factory('Schedule', ['$http', function($http) {
	function Schedule(scheduleData) {
		if (scheduleData) {
			this.setData(scheduleData);
		}
	};
	Schedule.prototype = {
			setData: function(scheduleData) {
				angular.extend(this, scheduleData);
			}
	};
	return Schedule;
}]);

angular.module('scheduleInstructorNote', [])

.factory('ScheduleInstructorNote', ['$http', function($http) {
	function ScheduleInstructorNote(scheduleInstructorNoteData) {
		if (scheduleInstructorNoteData) {
			this.setData(scheduleInstructorNoteData);
		}
	};
	ScheduleInstructorNote.prototype = {
			setData: function(scheduleInstructorNoteData) {
				angular.extend(this, scheduleInstructorNoteData);
			}
	};
	return ScheduleInstructorNote;
}]);

angular.module('scheduleTermState', [])

.factory('ScheduleTermState', ['$http', function($http) {
	function ScheduleTermState(scheduleTermStateData) {
		if (scheduleTermStateData) {
			this.setData(scheduleTermStateData);
		}
	};
	ScheduleTermState.prototype = {
			setData: function(scheduleTermStateData) {
				angular.extend(this, scheduleTermStateData);
			}
	};
	return ScheduleTermState;
}]);

angular.module('section', [])

.factory('Section', ['$http', function($http) {
	function Section(sectionData) {
		if (sectionData) {
			this.setData(sectionData);
		}
	};
	Section.prototype = {
			setData: function(sectionData) {
				angular.extend(this, sectionData);
			}
	};
	return Section;
}]);

angular.module('sectionGroup', [])

.factory('SectionGroup', ['$http', function($http) {
	function SectionGroup(coData) {
		if (coData) {
			this.setData(coData);
		}
	};
	SectionGroup.prototype = {
			setData: function(coData) {
				angular.extend(this, coData);
			}
	};
	return SectionGroup;
}]);

angular.module('tag', [])

.factory('Tag', ['$http', function($http) {
	function Tag(tagData) {
		if (tagData) {
			this.setData(tagData);
		}
	};
	Tag.prototype = {
		setData: function(tagData) {
			angular.extend(this, tagData);
		},
		getTextColor: function () {
			var THRESHOLD = 180;
			var BLACK = "#000000";
			var WHITE = "#FFFFFF";
			if (this.color
				&& ((parseInt(this.color.substring(1, 3), 16)
				+ parseInt(this.color.substring(3, 5), 16)
				+ parseInt(this.color.substring(5, 7), 16)) / 3) > THRESHOLD) {
				return BLACK;
			} else {
				return WHITE;
			}
		}
	};
	return Tag;
}]);

/**
 * @author okadri
 * Stores instructor receipt information for a given TeachingCall
 * It has a flag to indicate whether the instructor has completed inputing preferences
 */
angular.module('teachingAssignment', [])

.factory('TeachingAssignment', ['$http', function($http) {
	function TeachingAssignment(teachingAssignmentData) {
		if (teachingAssignmentData) {
			this.setData(teachingAssignmentData);
		}
	};
	TeachingAssignment.prototype = {
			setData: function(teachingAssignmentData) {
				angular.extend(this, teachingAssignmentData);
			}
	};
	return TeachingAssignment;
}]);

angular.module('teachingCall', [])

.factory('TeachingCall', ['$http', function($http) {
	function TeachingCall(teachingCallData) {
		if (teachingCallData) {
			this.setData(teachingCallData);
		}
	};
	TeachingCall.prototype = {
			setData: function(teachingCallData) {
				angular.extend(this, teachingCallData);
			}
	};
	return TeachingCall;
}]);

/**
 * @author okadri
 * Stores instructor receipt information for a given TeachingCall
 * It has a flag to indicate whether the instructor has completed inputing preferences
 */
angular.module('teachingCallReceipt', [])

.factory('TeachingCallReceipt', ['$http', function($http) {
	function TeachingCallReceipt(teachingCallReceiptData) {
		if (teachingCallReceiptData) {
			this.setData(teachingCallReceiptData);
		}
	};
	TeachingCallReceipt.prototype = {
			setData: function(teachingCallReceiptData) {
				angular.extend(this, teachingCallReceiptData);
			}
	};
	return TeachingCallReceipt;
}]);

/**
 * @author okadri
 * Stores instructor availabilities and comments for a given TeachingCall and TermCode
 */
angular.module('teachingCallResponse', [])

.factory('TeachingCallResponse', ['$http', function($http) {
	function TeachingCallResponse(teachingCallResponseData) {
		if (teachingCallResponseData) {
			this.setData(teachingCallResponseData);
		}
	};
	TeachingCallResponse.prototype = {
			setData: function(teachingCallResponseData) {
				angular.extend(this, teachingCallResponseData);
			}
	};
	return TeachingCallResponse;
}]);

angular.module('teachingPreference', [])

.factory('TeachingPreference', ['$http', function($http) {
	function TeachingPreference(teachingPreferenceData) {
		if (teachingPreferenceData) {
			this.setData(teachingPreferenceData);
		}
	};
	TeachingPreference.prototype = {
			setData: function(teachingPreferenceData) {
				angular.extend(this, teachingPreferenceData);
			}
	};
	return TeachingPreference;
}]);

angular.module('term', [])

.factory('Term', ['$http', function($http) {
	function Term(termData) {
		if (termData) {
			this.setData(termData);
		}
	};
	Term.prototype = {
			setData: function(termData) {
				angular.extend(this, termData);
			},

			// Generates a useful table of terms for the given academic year, e.g. for academicYear = 2016
			// { id: 10, description: "Fall Quarter", shortCode: "10", termCode: "201610" }
			// { id: 1, description: "Winter Quarter", shortCode: "01", termCode: "201701" }
			// etc.
			generateTable: function(academicYear) {
				var table = [
					{ id: 5,  description: "Summer Session 1",       shortCode: "05"},
					{ id: 6,  description: "Summer Special Session", shortCode: "06"},
					{ id: 7,  description: "Summer Session 2",       shortCode: "07"},
					{ id: 8,  description: "Summer Quarter",         shortCode: "08"},
					{ id: 9,  description: "Fall Semester",          shortCode: "09"},
					{ id: 10, description: "Fall Quarter",           shortCode: "10"},
					{ id: 1,  description: "Winter Quarter",         shortCode: "01"},
					{ id: 2,  description: "Spring Semester",        shortCode: "02"},
					{ id: 3,  description: "Spring Quarter",         shortCode: "03"}
				];
				var year;
				angular.forEach(table, function(term, i) {
					if(Number(term.shortCode) < 5) {
						year = (Number(academicYear) + 1);
					} else {
						year = academicYear;
					}
					term.code = year.toString() + term.shortCode;
					term.fullDescription = term.description + ' ' + year.toString();
				});

				return table;
			},

			// Returns a proper term object for a given termCode
			getTermByTermCode: function (termCode) {
				if (typeof termCode != "string" || termCode.length != 6) { return; }

				var year;
				var termId = Number(termCode.slice(-2));
				if (termId < 5) {
					year = Number(termCode.substr(0, 4)) - 1;
				} else {
					year = Number(termCode.substr(0, 4));
				}
				var allTerms = this.generateTable(year);
				return _array_findById(allTerms, termId);
			}

	};

	return Term;
}]);

angular.module('user', [])

.factory('User', ['$http', function($http) {
	function User(userData) {
		if (userData) {
			this.setData(userData);
		}
	};
	User.prototype = {
			setData: function(userData) {
				angular.extend(this, userData);
			}
	};
	return User;
}]);

angular.module('userRole', [])

.factory('UserRole', ['$http', function($http) {
	function UserRole(userRoleData) {
		if (userRoleData) {
			this.setData(userRoleData);
		}
	};
	UserRole.prototype = {
			setData: function(userRoleData) {
				angular.extend(this, userRoleData);
			}
	};
	return UserRole;
}]);

angular.module('workgroup', [])

.factory('Workgroup', ['$http', function($http) {
	function Workgroup(workgroupData) {
		if (workgroupData) {
			this.setData(workgroupData);
		}
	};
	Workgroup.prototype = {
			setData: function(workgroupData) {
				angular.extend(this, workgroupData);
			}
	};
	return Workgroup;
}]);

var INITIAL_STATE = [];

var routeParamsThingy = function (state, action) {
	if (!state) {
		state = INITIAL_STATE;
	}

	if (!action || !action.type) {
		return state;
	}

	switch (action.type) {
		case "CHANGE_YEAR":
			state.year = action.payload.year;
			return state;
		case "CHANGE_WORKGROUP_ID":
			state.workgroupId = action.payload.workgroupId;
			return state;
		case "CHANGE_BOTH":
			state.workgroupId = action.payload.workgroupId;
			state.year = action.payload.year;
			return state;
		default:
			return state;
	}
}
window.sharedApp = angular.module('sharedApp',
	[
		// 3rd party modules
		'ui.bootstrap',
		'ngIdle',
		'ngSanitize',
		'ui.select',
		'selectize',

		// Local modules
		'courseOfferingGroup',
		'sectionGroup',
		'courseOffering',
		'course',
		'instructor',
		'location',
		'scheduleInstructorNote',
		'scheduleTermState',
		'tag',
		'workgroup',
		'user',
		'userRole',
		'schedule',
		'term',
		'role',
		'section',
		'activity',
		'building',
		'teachingAssignment',
		'teachingPreference',
		'teachingCall',
		'teachingCallReceipt',
		'teachingCallResponse'
	]
);

sharedApp
	// Set the CSRF token
	.config(['$httpProvider', '$compileProvider', 'IdleProvider', 'KeepaliveProvider', '$locationProvider',
		function ($httpProvider, $compileProvider, IdleProvider, KeepaliveProvider, $locationProvider) {
			// Add CSRF token to all requests
			var csrfHeader = $('meta[name=csrf-header]').attr('content');
			if(csrfHeader === undefined) {
				console.warn("CSRF meta tag not found.");
			} else {
				$httpProvider.defaults.headers.common[csrfHeader] = $('meta[name=csrf-token]').attr('content');
			}

			$httpProvider.useApplyAsync(true);
			$compileProvider.debugInfoEnabled(false);

			// Enable html5 mode paths
			$locationProvider.html5Mode({
				enabled: true
			});

			// Configure Idle settings
			IdleProvider.idle(25 * 60); // 25 minutes: After this amount of time passes without the user performing an action the user is considered idle
			IdleProvider.timeout(5 * 60); // 5 minute: The amount of time the user has to respond before they have been considered timed out
			KeepaliveProvider.interval(5 * 60); // 5 minutes: This specifies how often the KeepAlive event is triggered and the HTTP request is issued
		}])

	// Detect route errors
	.run(['$rootScope', 'Idle',
		function ($rootScope, Idle) {
			$rootScope.$on('$routeChangeStart', function (e, curr, prev) {
				if (curr.$$route && curr.$$route.resolve) {
					// Show a loading message until promises aren't resolved
					$rootScope.loadingView = true;
				}
			});

			$rootScope.$on('$routeChangeSuccess', function (e, curr, prev) {
				// Hide loading message
				$rootScope.loadingView = false;
			});

			// Set the initial 'unsavedItems' which is used for the alert
			// when fields are unsaved and the user tries to close the window
			$rootScope.unsavedItems = 0;
			$rootScope.toast = {};

			// Start ngIdle watch
			Idle.watch();
		}
	])

	// Listen to toast requests
	.run(['$rootScope',
		function ($rootScope) {
			$rootScope.$on('toast', function (event, data) {
				switch (data.type) {
					case "SUCCESS":
						toastr.success(data.message);
						break;
					case "ERROR":
						toastr.error(data.message);
						break;
					case "WARNING":
						toastr.warning(data.message);
						break;
					default:
						toastr.info(data.message);
						break;
				};
			});
	}]);

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

sharedApp.controller('ConfirmCtrl', this.ConfirmCtrl = function($scope, $uibModalInstance, title, body, okButton, showCancel) {
	$scope.title = title;
	$scope.body = body;
	$scope.okButton = okButton;
	$scope.showCancel = showCancel;
	$scope.confirm = function() {
		return $uibModalInstance.close("confirm");
	};
	return $scope.cancel = function() {
		return $uibModalInstance.dismiss("cancel");
	};
});

sharedApp.controller('ModalAddUnscheduledCourseCtrl', this.ModalAddUnscheduledCourseCtrl = function(
		$scope,
		$rootScope,
		$uibModalInstance,
		termService,
		courseService,
		term,
		hiddenCourses) {

	$scope.newCourseData = null;
	$scope.term = term;

	$scope.getTermName = function(term) {
		return termService.getTermName(term);
	};

	$scope.clearSearch = function() {
		noResults = false;
		if ($scope.newCourseData != null) {
			$scope.newCourse = null;
			$scope.newCourseData = null;
		}

	};

	$scope.searchCourses = function(query) {
		return courseService.searchCourses(query, hiddenCourses);
	};

	$scope.setCourse = function(item, model, label) {
		$scope.newCourseData = item;
	};

	$scope.ok = function () {
		$uibModalInstance.close($scope.newCourseData);
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.isFormIncomplete = function() {
		if ($scope.newCourseData == null) {
			return true;
		}
		return false;
	};

});
sharedApp.controller('NavCtrl', this.NavCtrl = function(
		$scope,
		$window,
		ngNotify
		// workgroupService,
		// sharedService,
		// userService,
		) {

	$scope.isImpersonating = userService.isImpersonating();
	$scope.waitingForImpersonating = false;
	$scope.loadingUsers = false;
	// Retrieve the data passed by the JSP from the JAVA controller
	// $scope.activeWorkgroup = userService.getActiveWorkgroup();
	// $scope.currentUser = userService.getCurrentUser();

	// Check if user is admin
	// $scope.isAdmin = userService.isAdmin();
	// $scope.isRegistrar = userService.isRegistrar();
	// $scope.isCoordinator = function(workgroup) {
	// 	return userService.isCoordinator(workgroup);
	// }

	$scope.meridiem = moment().format('a');
	$scope.thisYear = moment().year();

	// Collecting user workgroups
	$scope.workgroups = [];
	// workgroupService.getUserWorkgroups($scope.currentUser.id).then(function(data){
	// 	$scope.workgroups = data;
	// }, function(data) {
	// 	ngNotify.set("Error retrieving user's workgroups from server", "danger");
	// });

	// $scope.isSelectedYear = function(year) {
	// 	return year == sharedService.selectedYear();
	// };

	// $scope.searchUsers = function(query) {
	// 	return userService.searchIPAUsers(query).then(function(users) {
	// 		return users.map(function(user) {
	// 			user.description = user.firstName + ' ' + user.lastName + ' (' + user.loginId + ')';
	// 			return user;
	// 		});
	// 	}, function(data) {
	// 		ngNotify.set("Error querying users from server", "danger");
	// 	});
	// };

	// $scope.impersonate = function(item, model, label) {
	// 	// Show the user that something is happening while we $window.location.href them.
	// 	$scope.waitingForImpersonating = true;

	// 	userService.impersonate(item.loginId).then(function() {
	// 		$scope.navigateTo("/summary");
	// 	});
	// };

	// $scope.unImpersonate = function () {
	// 	userService.unImpersonate().then(function(data) {
	// 		$scope.navigateTo("/summary");
	// 	});
	// };

	$scope.navigateTo = function(url) {
		$window.location.href = $scope.rootUrl + url;
	};

});

sharedApp.controller('SharedCtrl', this.SharedCtrl = function(
		$rootScope,
		$scope,
		$http,
		$uibModal,
		Idle,
		Keepalive,
		siteConfig) {

	$rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
		if (!$rootScope.loadingError) { $rootScope.loadingError = 'unknown'; }
		console.error('Failed to change routes. Error code: ' + $rootScope.loadingError);
	});

	$scope.print = function(){
		window.print();
	};

	// ngIdle stuff
	$scope.rootUrl = siteConfig.rootUrl;

	function closeModals() {
		if ($scope.warning) {
			$scope.warning.close();
			$scope.warning = null;
		}

		if ($scope.timedout) {
			$scope.timedout.close();
			$scope.timedout = null;
		}
	}

	$scope.$on('IdleStart', function() {
		closeModals();

		$scope.warning = $uibModal.open({
			templateUrl: 'sessionWarning.html',
			backdrop : 'static'
		});
	});

	$scope.$on('IdleEnd', function() {
		closeModals();
		$scope.$digest();
	});

	$scope.$on('IdleTimeout', function() {
		closeModals();

		$scope.timedout = $uibModal.open({
			templateUrl: 'sessionTimedout.html',
			backdrop : 'static',
			scope: $scope
		});
	});

	$scope.$on('Keepalive', function() {
		$http.get("/status.json");
    });

});

/**
 * Function: Detects Keys: Enter and ESC, and detects blur.. Calls defined functions if model is changed
 * Usage: <input auto-input on-enter="save()" on-blur="save()" on-escape="cancel()"></input>
 */

sharedApp.directive("autoInput", this.autoInput = function($rootScope) {
	return {
		scope: {
			ngModel: '=',
			onEnter: '&',
			onEscape: '&',
			onBlur: '&',
			onReset: '&',
			onChange: '&',
			clearOnInit: '@',
			helpTextPlacement: '@'
		},
		require: '?ngModel',
		controller: function($scope) {
			this.preventActions = function() {
				$scope.init();
			};

			this.resetTextbox = function() {
				$scope.resetTextbox(null, true);
			};
		},
		link: function(scope, element, attrs, ngModelCtrl) {
			var ENTER = 13;
			var ESCAPE = 27;
			scope.originalModel = scope.ngModel;
			scope.toolTipShown = false;

			// Set the element to its initial state:
			// Enter is disabled, and escape calls onEscape
			scope.init = function() {
				ngModelCtrl.$setPristine();

				if (scope.clearOnInit === 'true') {
					scope.originalModel = scope.ngModel = '';
				}

				element.unbind("blur keydown keypress");
				element.bind("keydown keypress", function(event) {
					if (event.which === ESCAPE) { // Escape
						if (typeof attrs.onEscape === 'undefined') return;

						scope.$apply(function() {
							scope.onEscape();
						});
					}
					else if (!element.hasClass('ng-dirty')) {
						element.addClass('ng-dirty');
					}
				});
			};
			scope.init();

			scope.removeTooltip = function() {
				element.tooltip('hide');
				scope.toolTipShown = false;

				// Decrement number of unsaved items, and enable Save Shield
				// TODO: move this bit into a service
				if (--$rootScope.unsavedItems === 0) window.onbeforeunload = null;
			};

			scope.$watch('ngModel', function(newVal, oldVal){
				if (typeof newVal === 'undefined' || newVal === scope.originalModel) return;
				if (typeof attrs.onChange !== 'undefined' && element.hasClass('ng-dirty')) scope.onChange({ previousValue: oldVal, currentValue: newVal });

				if (newVal !== oldVal && element.hasClass('ng-dirty') && !element.is(':focus')) {
					scope.blurTextbox(null, true);
				}

				// Prevent window from closing and show tooltip if an onEnter method
				// is defined and if if the input is focused
				if (!scope.toolTipShown && typeof attrs.onEnter !== 'undefined'
					&& element.is(':focus')) {

					// Increment number of unsaved items, and enable Save Shield
					// TODO: Move this bit into a service
					$rootScope.unsavedItems++;
					window.onbeforeunload = function() {
						return "Some changes have not been saved yet";
					};

					// Add a tooltip to show that this is not yet saved
					element.tooltip({
						title: 'Enter to save',
						placement: scope.helpTextPlacement || 'right',
						trigger: 'manual'
					});
					element.tooltip('show');
					scope.toolTipShown = true;
				}

				element.unbind("blur keydown keypress");
				// Start listening to Enter and Blur events
				element.bind("keydown keypress", function(event) {
					if (event.which === ENTER) { // Enter
						if (typeof attrs.onEnter === 'undefined') return;

						scope.removeTooltip();

						scope.$apply(function() {
							scope.onEnter({originalValue: scope.originalModel});
							scope.originalModel = scope.ngModel;
							scope.init();
						});
					}
					if (event.which === ESCAPE) { // Escape
						scope.resetTextbox(event);
					}
				});
				element.bind("blur", scope.blurTextbox);
			});

			scope.blurTextbox = function(event, noApply) {
				if (typeof attrs.onBlur === 'undefined') return;

				scope.removeTooltip();

				var runBlurAction = function() {
					scope.onBlur({originalValue: scope.originalModel});
					scope.originalModel = scope.ngModel;
					scope.init();
				};

				if (noApply)
					runBlurAction();
				else
					scope.$apply(runBlurAction);
			}

			scope.resetTextbox = function(event, noApply) {
				if (event)
					event.preventDefault();

				scope.removeTooltip();

				var resetModel = function() {
					if (typeof attrs.onReset !== 'undefined')
						scope.onReset({currentValue: scope.ngModel, originalValue: scope.originalModel});

					scope.ngModel = scope.originalModel;
					scope.init();
					if (typeof attrs.onEscape !== 'undefined') scope.onEscape();
				};

				if (noApply) {
					resetModel();
				} else {
					scope.$apply(resetModel);
				}
			};
		}
	}
})
sharedApp.directive("availabilityGrid", this.availabilityGrid = function($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'availabilityGrid.html',
		replace: true,
		scope: {
			blob: '=',
			readOnly: '=',
			onChange: '&'
		},
		link: function(scope, element, attrs) {
			scope.days = ['M', 'T', 'W', 'R', 'F'];
			scope.hours = [7,8,9,10,11,12,1,2,3,4,5,6,7,8,9];

			scope.buildAvailabilityObject = function(blobArray) {
				var i = 0;
				scope.availability = {};
				for ( d = 0; d < scope.days.length; d++) {
					scope.availability[d] = {};
					for ( h = 0; h < scope.hours.length; h++) {
						if (i < blobArray.length) {
							scope.availability[d][h] = blobArray[i++];
						} else {
							// Should never happen: makes sure the object is of the
							// correct length if the blob passed was less than 75 items
							scope.availability[d][h] = '1';
						}
					}
				}
			};

			// Default availability array (all available)
			// This line creates an all 1's array the length of days x hours
			var blobArray = Array.apply(null, {length: (scope.days.length * scope.hours.length)}).map(function(){return 1;});
			scope.buildAvailabilityObject(blobArray);

			// Translate blob into availability array
			scope.$watch('blob', function(blob) {
				if (typeof blob === 'undefined') return;
				var blobArray = blob.split(',');
				scope.buildAvailabilityObject(blobArray);
			});

			scope.saveAvailability = function () {
				if (scope.readOnly) return;

				// Translate back into blob
				var blob = []
				for ( d = 0; d < scope.days.length; d++) {
					for ( h = 0; h < scope.hours.length; h++) {
						blob.push(scope.availability[d][h]);
					}
				}
				var stringBlob = blob.join(',');

				// Report changes back to controller after some delay
				$timeout.cancel(scope.timeout);
				scope.timeout = $timeout(function() {
					scope.onChange({blob: stringBlob});
				}, 500);
			};

			// Highlights the day/hour on hover
			element.delegate('td','mouseover mouseleave', function(e) {
				if (e.type == 'mouseover') {
					$(this).siblings('th').addClass("hover");
					element.find("thead th").eq($(this).index()).addClass("hover");
				}
				else {
					$(this).siblings('th').removeClass("hover");
					element.find("thead th").eq($(this).index()).removeClass("hover");
				}
			});

			// Highlights on drag if not locked
			if (!scope.readOnly) {

				var isMouseDown = false;
				var dragValue,dragClass;
				element.delegate('td','mousedown', function(e) {
					isMouseDown = true;
					var d = $(this).data().day;
					var h = $(this).data().hour;
					dragValue = scope.availability[d][h] = 1- scope.availability[d][h];
					scope.saveAvailability();

					dragClass = dragValue === 0 ? 'unavailable' : 'available'
					$(this).removeClass('available unavailable');
					$(this).addClass(dragClass);
					return false; // prevent text selection
				})
				.delegate('td','mouseover', function(e) {
					if (isMouseDown) {
						var d = $(this).data().day;
						var h = $(this).data().hour;
						scope.availability[d][h] = dragValue;
						scope.saveAvailability();

						$(this).removeClass('available unavailable');
						$(this).addClass(dragClass);
					}
				})
				.bind("selectstart", function () {
					return false; // prevent text selection in IE
				});

				$(document)
				.mouseup(function () {
					isMouseDown = false;
				});

			}
		}
	};
});

/**
 * Colorpicker input directive
 * Example: <colorpicker type="text" color="my.model" />
 */
sharedApp.directive("colorpicker", this.colorpicker = function () {
	return {
		restrict: "E",
		template: "<div class=\"input-group\"> " +
		"		<input type=\"text\" class=\"form-control\" ng-model=\"color\" > " +
		"		<div class=\"input-group-addon\"> " +
		"			<i class=\"color-preview\" ng-style=\"{ 'background-color': color }\"></i> " +
		"		</div> " +
		"	</div> ",
		replace: true,
		scope: {
			color: '=',
			onChange: '&'
		},
		link: function (scope, element, attrs) {
			element
				.colorpicker({
					format: 'hex'
				})
				.on('changeColor', function (e) {
					scope.color = e.color.toHex();
					scope.$apply();
				})
				.on('hidePicker', function (e) {
					scope.onChange();
					scope.$apply();
				});
		}
	}
})
sharedApp.directive("confirmButton", this.confirmButton = function($document) {
	return {
		restrict: 'A',
		scope: {
			confirmAction: '&confirmButton',
			confirmIsShown: '=?',
			confirmIsEnabled: '='
		},
		link: function (scope, element, attrs) {
			var buttonId = Math.floor(Math.random() * 10000000000),
			message = attrs.message || "Are you sure?",
			yep = attrs.yes || "Yes",
			nope = attrs.no || "No",
			title = attrs.title || "Confirm",
			btnClass = attrs.btnClass || "btn-danger",
			placement = attrs.placement || "bottom";

			var html = "<div id=\"button-" + buttonId + "\" style=\"position: relative; width: 250px;\">" +
				"<p class=\"confirmbutton-msg\">" + message + "</p>" +
				"<div align=\"center\">" +
					"<button class=\"confirmbutton-yes btn " + btnClass + "\">" + yep + "</button> " +
					"<button class=\"confirmbutton-no btn btn-default\">" + nope + "</button>" +
				"</div>" +
			"</div>";

			element.popover({
				content: html,
				html: true,
				trigger: "manual",
				title: title,
				placement: placement,
				container: 'body'
			}).on('hidden.bs.popover', function () {
				scope.confirmIsShown = false;
				scope.$apply();
			}).on('shown.bs.popover', function () {
				scope.confirmIsShown = true;
				scope.$apply();
			});

			element.bind('click', function(e) {
				// Disable confirmation if confirmIsEnabled is provided but not true
				if (typeof scope.confirmIsEnabled !== 'undefined' && !scope.confirmIsEnabled) {
					scope.confirmAction();
					return;
				}

				var dontBubble = true;
				e.stopPropagation();

				element.popover('show');
				element.addClass('active');

				var pop = $("#button-" + buttonId);

				pop.closest(".popover").click(function(e) {
					if (dontBubble) {
						e.stopPropagation();
					}
				});

				pop.find('.confirmbutton-yes').click(function(e) {
					e.stopPropagation();
					dontBubble = false;
					scope.$apply(scope.confirmAction);
					element.popover('hide');
					element.removeClass('active');
				});

				pop.find('.confirmbutton-no').click(function(e) {
					e.stopPropagation();
					dontBubble = false;
					$document.off('click.confirmbutton.' + buttonId);
					element.popover('hide');
					element.removeClass('active');
				});

				$document.on('click.confirmbutton.' + buttonId, ":not(.popover, .popover *)", function() {
					$document.off('click.confirmbutton.' + buttonId);
					element.popover('hide');
					element.removeClass('active');
				});
			});
		}
	};
})
sharedApp.directive("disableElement", this.disableElement = function() {
	return {
		restrict: "AE",
		scope: {
			disableElement: '='
		},
		link: function(scope, element, attrs) {
			scope.$watch('disableElement', function(disableElement){
				if (disableElement) {
					element
						.css('position','relative')
						.css('overflow','hidden')
						.css('cursor','not-allowed');
					element.prepend("<div class='disable-cover'></div>");
				} else {
					element
						.css('position','')
						.css('overflow','')
						.css('cursor','');
					element.find('.disable-cover').remove();
				}
			});
		}
	}
})
sharedApp.directive("focusOnShow", this.focusOnShow = function($timeout) {
	return function(scope, element, attrs) {
		// Case 1: using ng-if
		$timeout(function() {
			element.focus();
		});

		// Case 2: using ng-show
		scope.$watch(attrs.ngShow, function (newValue) {
			$timeout(function() {
				newValue && element.focus();
			});
		},true);
	};
})
sharedApp.directive("multiselectDropdown", this.multiselectDropdown = function() {
	return {
		templateUrl: 'multiselectDropdown.html',
		restrict: 'A',
		scope: {
			items: '=',
			activeIds: '=',
			toggleItem: '&'
		},
		link: function(scope, element, attrs) {
			scope.selectItem = function($event, id) {
				// Ensure checkboxes do not close the dropdown
				$event.preventDefault();
				$event.stopPropagation();

				if(typeof attrs.toggleItem !== 'undefined') {
					// This is how we call the callback.
					// See: http://tech.europace.de/passing-functions-to-angularjs-directives/
					scope.toggleItem( { id: id } );
				}
			}
		}
	}
});

sharedApp.directive("nav", this.nav = function($location, $rootScope, authService, Term) {
	return {
		restrict: 'E',
		templateUrl: 'nav.html',
		replace: true,
		link: function (scope, element, attrs) {
			scope.sharedState = authService.getSharedState();
			scope.termCode = attrs.termCode;

			// TODO: Shouldn't this be set somewhere to be shared outside of <nav> ? -CT
			$rootScope.$on('sharedStateSet', function (event, data) {
				scope.sharedState = data;
			});
			// TODO: Move shared data being put into the nav directive. Yay clean architecture. -CT
			// A list of all possible terms, not necessarily the ones
			// with data for this schedule.
			// We leave code '04' off because it is unused.
			// This table is purposefully ordered in the order of terms in an academic year (starts with 5).
			scope.termDefinitions = Term.prototype.generateTable(scope.year);

			// Sidebar Collapse icon
			element.find(".sidebar-collapse-icon").on('click', function (ev) {
				ev.preventDefault();
				var open = $('.page-container').hasClass("sidebar-collapsed");

				if (open) {
					$('.page-container').removeClass("sidebar-collapsed");
				}
				else {
					$('.page-container').addClass("sidebar-collapsed");
				}
			});

			scope.changeYearBy = function (offset) {
				if (!offset || !scope.sharedState.workgroup) { return; }

				// Increment/decrement the year
				scope.sharedState.year = parseInt(scope.sharedState.year) + offset;

				// Redirect the page
				var termCode = scope.termCode ? Number(scope.termCode) + (offset * 100) : '';
				var url = '/' + scope.sharedState.workgroup.id + '/' + scope.sharedState.year + '/' + termCode;
				$location.path(url);
			};

			scope.logout = function () {
				authService.logout();
			}
		}
	}
})
/**
 * Triggers 'open' on the clicked popover, and close on the other popovers
 * Requires to change the default trigger of the element to 'open'
 * e.g popover-trigger="open"
 */
sharedApp.directive("popoverToggleCloseOthers", this.popoverToggleCloseOthers = function() {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			scope.closeOthers = function() {
				$('*[uib-popover], *[uib-popover-template]').not(element).each(function(){
					angular.element(this).triggerHandler('close');
				});
				$('.popover.in').remove();
			};

			scope.open = function() {
				element.triggerHandler('open');
			};

			if (!angular.isDefined(attr.initCallback)) {
				element.bind('click', function (e) {
					e.stopPropagation();
					scope.closeOthers();
					scope.open();
				});
			}
		}
	};
});
sharedApp.directive("preventDefault", this.preventDefault = function() {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			element.bind(attr.preventDefault, function (e) {
				e.preventDefault();
			});
		}
	};
});
sharedApp.directive("searchableMultiselect", this.searchableMultiselect = function() {
	return {
		templateUrl: 'searchableMultiselect.html',
		restrict: 'AE',
		scope: {
			displayAttr: '@',
			selectedItems: '=',
			allItems: '=',
			readOnly: '=',
			selectItem: '&',
			unselectItem: '&',
			addItem: '&',
			isSearchable: '@'
		},
		link: function(scope, element, attrs) {
			scope.canAdd = (typeof attrs.addItem !== 'undefined');

			scope.updateSelectedItems = function(obj) {
				var selectedObj;
				for (i = 0; typeof scope.selectedItems !== 'undefined' && i < scope.selectedItems.length; i++) {
					if (typeof scope.selectedItems[i][scope.displayAttr] !== 'undefined'
							&& scope.selectedItems[i][scope.displayAttr].toUpperCase() === obj[scope.displayAttr].toUpperCase()) {
						selectedObj = scope.selectedItems[i];
						break;
					}
				}
				if ( typeof selectedObj === 'undefined' ) {
					scope.selectItem({item: obj});
				} else {
					scope.unselectItem({item: selectedObj});
				}
			};

			scope.isItemSelected = function(item) {
				if ( typeof scope.selectedItems === 'undefined' ) return false;

				var tmpItem;
				for (i=0; i < scope.selectedItems.length; i++) {
					tmpItem = scope.selectedItems[i];
					if ( typeof tmpItem !== 'undefined'
					&&	typeof tmpItem[scope.displayAttr] !== 'undefined'
					&&	typeof item[scope.displayAttr] !== 'undefined'
					&&	tmpItem[scope.displayAttr].toUpperCase() === item[scope.displayAttr].toUpperCase() ) {
						return true;
					}
				}

				return false;
			};

			scope.commaDelimitedSelected = function() {
				var list = "";
				angular.forEach(scope.selectedItems, function (item, index) {
					if (typeof item[scope.displayAttr] === 'undefined')
						return;
					list += item[scope.displayAttr];
					if (index < scope.selectedItems.length - 1) list += ', ';
				});
				return list.length ? list : "Nothing Selected";
			}
		}
	}
});

sharedApp.directive("slider", this.slider = function() {
	return {
		restrict: "AE",
		scope: {
			sliderValue: '=',
			sliderMin: '=',
			sliderMax: '=',
			sliderStep: '='
		},
		template: "<div class=\"slider\"></div>\
			<input type=\"number\" class=\"slider-label\" ng-model=\"sliderValue\"\
			max=\"{{sliderMax}}\" min=\"{{sliderMin}}\" step=\"{{sliderStep}}\" />",
			link: function(scope, element, attrs) {
				scope.$watch('sliderValue', function(newVal,oldVal) {
					$('.slider', element).slider({
						value: scope.sliderValue,
						min: scope.sliderMin,
						max: scope.sliderMax,
						step: scope.sliderStep,
						slide: function( event, ui ) {
							scope.sliderValue = ui.value
							$('.slider-label', element).val( scope.sliderValue );
						}
					});
				});
			}
	}
})
sharedApp.directive("sortable", this.sortable = function() {
	return {
		restrict: "AE",
		scope: {
			dragStart: '&',
			dragEnd: '&',
			readOnly: '='
		},
		link: function(scope, element, attrs) {
			scope.$watch('readOnly', function(readOnly){
				if(readOnly) element.sortable().sortable( "disable" );
			});

			element.sortable({
				items: ">li:not(.unsortable)",
				cancel:".disable-sorting",
				start: function( event, ui ) {
					scope.dragStart;
				},
				update: function( event, ui ) {
					var sortedIds = element.sortable( "serialize" ).split('pref[]=').join('').split('&');
					scope.dragEnd({sortedIds: sortedIds});
				},
				axis: "y"
			});
		}
	}
})
sharedApp.directive("spinner", this.spinner = function(siteConfig) {
	return {
		restrict: "E",
		replace: true,
		template: "<div style='width: 100%;' align='center'><div class='spinner-container'></div></div>",
		link: function(scope, element, attrs) {
			var opts = {
				length: 4,
				width: 2,
				radius: 4,
				scale: 0.15,
				left: '0%',
				className: 'spinner',
				position: 'relative'
			};

			var target = $('.spinner-container', element);
			var spinner = new Spinner(opts).spin(target.get(0));
			element.prepend("<span ng-show='text'>" + attrs.text +" </span>");
		}
	}
})
sharedApp.directive("stickyHeader", this.stickyHeader = function($timeout) {
	return {
		restrict: 'C',
		link: function(scope, element, attrs) {
			// Check if a repeatEvery number was passed, otherwise default to 20
			var numRepeat = parseInt(attrs.repeatEvery);
			scope.repeatEvery = isNaN(numRepeat) ? 20 : numRepeat;

			// Method to make the header sticky if the browser supports it, returns false if not
			var makeSticky = function() {
				var values = ['-webkit-sticky','-moz-sticky','-ms-sticky','-o-sticky'];
				for (var i = 0; i < values.length; i++) {
					element.find('thead').css('position',values[i]);
					if (element.find('thead').css('position') === values[i]) {
						return true;
					}
				}
				return false;
			};

			// If the browser does not support position: sticky, repeat header
			if (makeSticky() === false) {
				scope.$watch( function() {
					return element.find('thead > tr > th').length * element.find('tr:not(.cloned-header):visible').length;
				}, function(newVal, oldVal) {
					element.find('tr.cloned-header').remove();

					var row = scope.repeatEvery;
					var tbodies = element.find('tbody').length;
					var selector;

					if (tbodies > 1) {
						selector = 'tbody';
					} else {
						selector = 'tbody tr';
					}

					repetitions = Math.floor(element.find(selector + ':not(.cloned-header):visible').length / scope.repeatEvery);

					for (var i = 0; i < repetitions; i++) {
						var tr = element.find('thead tr').clone().css('background-color','#eee').addClass('cloned-header');
						angular.element(element.find(selector).get(row - 1)).after(tr);
						row += scope.repeatEvery;
					}
				});
			}


		}
	}
});

sharedApp.directive("stopEvent", this.stopEvent = function() {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			element.bind(attr.stopEvent, function (e) {
				e.stopPropagation();
			});
		}
	};
});
sharedApp.directive("termPreferences", this.termPreferences = function($uibModal) {
	return {
		restrict: 'A',
		templateUrl: 'termPreferences.html',
		scope: {
			preference: '=',
			scheduleId: '=',
			term: '=',
			instructorId: '=',
			hiddenCourseOfferingIds: '@',
			hiddenCourses: '@',
			disableSabbatical: '=?',
			sabbaticalDisableMessage: '@',
			readOnly: '=',
			onSelect: '&',
			onDelete: '&',
			onUpdate: '&'
		},
		link: function(scope, element, attrs) {
			scope.year = scope.$parent.year;
			scope.term = termToTermCode(scope.term, scope.year);

			scope.courses = scope.$parent.view.state.activeTeachingCall.scheduledCourses[scope.term];

			scope.status = {};
			scope.deletable = (typeof attrs.onDelete != 'undefined');
			scope.getDescription = function(preference) {
				if (typeof preference === 'undefined') return 'Add';
				else if (preference.isBuyout) return 'Buyout';
				else if (preference.isSabbatical) return 'Sabbatical';
				else if (preference.isCourseRelease) return 'Course Release';
				else {
					return preference.subjectCode + ' ' + preference.courseNumber;
				}
			}

			scope.$watchGroup(['status.dropDownIsOpen','status.confirmIsOpen'], function(newVal) {
				if (newVal) element.addClass('disable-sorting');
				else element.removeClass('disable-sorting');
			});

		} // End link block
	};
});

termToTermCode = function(term, year) {
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

/**
 * Returns a string in the form Last, First"
 * Expects an object with properties: firstName, and lastName
 * Removes the "." from the generic instructor "The Staff"
 */

sharedApp.filter("lastCommaFirst", this.lastCommaFirst = function() {
	return function (instructor) {
		if (!(instructor && instructor.firstName && instructor.lastName)) return;
		return [instructor.lastName, instructor.firstName].filter(function(name) {
			return name.trim() !== ".";
		}).join(", ");
	};
});
/**
 * Returns a string in the form Last F"
 * Expects an object with properties: firstName, and lastName
 * Removes the "." from the generic instructor "The Staff"
 */

sharedApp.filter("lastSpaceInitial", this.lastSpaceInitial = function() {
	return function (instructor) {
		if (!(instructor && instructor.firstName && instructor.lastName)) return;
		var firstInitial = instructor.firstName.charAt(0);
		return [instructor.lastName, firstInitial].filter(function(name) {
			return name.trim() !== ".";
		}).join(" ");
	};
});
/**
 * Returns a string in the form 5th"
 * Expects an Integer
 */

sharedApp.filter("ordinal", this.ordinal = function() {
	return function (number) {
		if (number && isNumber(number)) {
			return toOrdinalSuffix(number);
		}
	};
});
'use strict';

/**
 * @ngdoc service
 * @name ipaClientAngularApp.authService
 * @description
 * # authService
 * Service in the ipaClientAngularApp.
 */
angular.module('sharedApp')
	.service('authService', function ($http, $window, $q, $location, $rootScope) {
		return {
			activeWorkgroup: {},
			activeYear: 0,
			userWorkgroups: [],
			displayName: "",

			/**
			 * Validates the given JWT token with the backend.
			 */
			validate: function (token, workgroupId, year) {
				var deferred = $q.defer();
				var userRoles = this.getUserRoles();
				var displayName = localStorage.getItem('displayName');
				var scope = this;

				$http.post(serverRoot + '/login', { token: token, userRoles: userRoles, displayName: displayName }, { withCredentials: true }).then(function (response) {
					// Token may be null if we are redirecting
					if (response.data != null && response.data.token !== null) {
						var token = response.data.token;

						$http.defaults.headers.common.Authorization = 'Bearer ' + token;

						localStorage.setItem('JWT', token);
						localStorage.setItem('userRoles', JSON.stringify(response.data.userRoles));
						localStorage.setItem('displayName', response.data.displayName);

						// If workgroupId or year NOT set
						if ( !workgroupId || !year) {
							scope.fallbackToDefaultUrl();
							$rootScope.$emit('sharedStateSet', scope.getSharedState());
							deferred.reject();
						} else {
							scope.setSharedState(workgroupId, year, response.data.displayName);
						}

						deferred.resolve(response);
					} else if(response.data != null && response.data.redirect != null && response.data.redirect.length > 0) {
						// Received a request to redirect to CAS. Obey.
						localStorage.removeItem('JWT');
						localStorage.removeItem('userRoles');
						localStorage.removeItem('displayName');
						$window.location.href = response.data.redirect + "?ref=" + document.URL;

						deferred.reject();
					}
				}, function (error) {
					if (error.status == 400) {
						// Token is invalid. Grab a new token
						localStorage.removeItem('JWT');
						location.reload();
					} else if (error.status == 403) {
						// User has no access, redirect to Access Denied page
						console.error("Authentication request received a 403. Redirecting to access denied page ...");
						localStorage.clear();
						$window.location.href = "/access-denied.html";
					} else if(error.status == -1) {
						console.error("Request was aborted or server was not found. Check that the backend is running.");
						$window.location.href = "/unknown-error.html";
					} else {
						console.error("Unknown error occurred while authenticating. Details:");
						console.error(error);
						$window.location.href = "/unknown-error.html";
					}
				});

				return deferred.promise;
			},

			logout: function () {
				localStorage.removeItem('JWT');
				localStorage.removeItem('userRoles');
				localStorage.removeItem('displayName');
				$window.location.href = serverRoot + "/logout";
			},

			getUserRoles: function () {
				var userRoles = null;

				try {
					userRoles = JSON.parse(localStorage.getItem('userRoles'));
				} catch(err) {
					console.log(err);
				}

				return userRoles;
			},

			fallbackToDefaultUrl: function() {
				var userRoles = this.getUserRoles();
				for (var i = 0; i < userRoles.length; i++) {
					userRole = userRoles[i];

					if (userRole.workgroupId > 0) {
						var workgroupId = userRole.workgroupId;
						var year = new Date().getFullYear();
						var url = '/' + workgroupId + '/' + year;
						$location.path(url);
					}
				}
			},

			setSharedState: function (workgroupId, year, displayName) {
				var scope = this;
				var userRoles = scope.getUserRoles();
				scope.activeYear = year;
				scope.displayName = displayName;

				for (var i = 0; i < userRoles.length; i++) {
					userRole = userRoles[i];
					var workgroup = {
						id: userRole.workgroupId,
						name: userRole.workgroupName
					}

					// Append to userWorkgroups iff workgroup is valid and avoid duplicates
					if (workgroup.id > 0 && _array_findById(scope.userWorkgroups, workgroup.id) == undefined) {
						scope.userWorkgroups.push(workgroup);
					}

					if (userRole.workgroupId == workgroupId) {
						scope.activeWorkgroup = workgroup;
					}
				}

				$rootScope.$emit('sharedStateSet', scope.getSharedState());
			},

			getSharedState: function () {
				return {
					workgroup: this.activeWorkgroup,
					year: this.activeYear,
					userWorkgroups: this.userWorkgroups,
					displayName: this.displayName
				}
			}
		};
	});

angular.module('sharedApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('access-denied.html',
    "<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Academic planning for UC Davis\"><meta name=author content=\"UC Davis Division of Social Science IT Development Team\"><title>Instructional Planning and Administration</title><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/shared.css></head><body><div id=access-denied class=jumbotron><h1>Access Denied</h1><p class=lead>You are not authorized to access IPA. Please contact IT to resolve this issue.</p></div></body></html>"
  );


  $templateCache.put('admin.html',
    ""
  );


  $templateCache.put('assignment.html',
    "<!DOCTYPE html><html lang=en><head><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Neon Admin Panel\"><meta name=author content=\"\"><link rel=icon href=/images/favicon.ico><title>IPA Assignments</title><link rel=stylesheet href=/css/entypo.css><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/neon-core.css><link rel=stylesheet href=/css/neon-theme.css><link rel=stylesheet href=/css/neon-forms.css><link rel=stylesheet href=/css/shared.css><link rel=stylesheet href=/css/assignments.css><link rel=stylesheet href=/css/teaching-call-modal.css><link rel=stylesheet href=/css/select2-bootstrap.css><link rel=stylesheet href=/css/select2.css><script src=/js/lib.js></script></head><body class=page-body ng-app=assignmentApp class=ng-cloak ng-cloak><base href=/assignments/ ><div class=\"page-container sidebar-collapsed\" ng-view></div><div id=toast-container class=toast-top-right ng-if=\"$root.toast.message.length > 0\"><div class=\"toast toast-error\" style=\"display: block\"><div class=toast-message ng-bind=$root.toast.message></div></div></div><script src=/js/select2.min.js></script><script src=/js/sharedApp.js></script><script src=/js/sharedConfig.js></script><script src=/js/assignmentApp.js></script><script src=/js/jquery-ui.min.js></script></body></html>"
  );


  $templateCache.put('teachingCall.html',
    "<html><body ng-app=assignmentApp><div ng-controller=TeachingCallCtrl></div></body></html>"
  );


  $templateCache.put('AssignmentCtrl.html',
    "<nav year=\"{{ year }}\" term-code=\"{{ termCode }}\" workgroup-id=\"{{ workgroupId }}\"></nav><div class=main-content><h3 style=\"text-align: center\">Assignments</h3><div class=row style=\"margin-bottom: 2em\"><div class=\"col-sm-offset-3 col-sm-6\"><input type=search class=form-control placeholder=Search ng-model=searchQuery ng-change=filterTable(searchQuery)></div></div><div class=row style=\"margin-bottom: 1em\"><div class=col-sm-3><div class=btn-group data-toggle=buttons><label class=\"btn btn-white btn-sm active\" id=courses-pivot ng-click=showCourses()><input type=radio name=options> <span class=\"tool-icon glyphicon glyphicon-education\"></span> By Course</label><label class=\"btn btn-white btn-sm\" id=instructors-pivot ng-click=showInstructors()><input type=radio name=options> <span class=\"tool-icon glyphicon glyphicon-user\"></span> By Instructor</label></div></div><div class=col-sm-2><span><a ng-if=\"view.state.teachingCalls.eligibleGroups.federationInstructors || view.state.teachingCalls.eligibleGroups.senateInstructors\" class=\"btn btn-block btn-default begin-teaching-call-button\" ng-click=openTeachingCallConfig()>Create Teaching Call</a><div data-toggle=tooltip data-placement=top data-original-title=\"All instructors already assigned to a teaching call\" data-container=body><a ng-if=\"view.state.teachingCalls.eligibleGroups.federationInstructors == false && view.state.teachingCalls.eligibleGroups.senateInstructors == false\" class=\"btn btn-block btn-default begin-teaching-call-button disabled\">Create Teaching Call</a></div></span></div></div><div class=row><div class=col-sm-12><div class=table-toolbar><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-list-alt\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=\"dropdown-menu dropdown-menu-right\" multiselect-dropdown items=termDefinitions active-ids=view.state.userInterface.enabledTerms.ids toggle-item=termToggled(id)></ul></div><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-filter\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=\"dropdown-menu dropdown-menu-right\"><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Published Courses</a></li><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Unpublished Courses</a></li></ul></div><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-download-alt\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=\"dropdown-menu dropdown-menu-right\"><li><a href=# class=small>as Excel</a></li><li><a href=# class=small>as CSV</a></li></ul></div><span class=\"tool-icon glyphicon glyphicon-print\" data-toggle=tooltip data-placement=top data-original-title=Print></span></div></div></div><div course-assignment-table id=courses-table ng-show=view.state.userInterface.showCourses></div><div instructor-assignment-table id=instructors-table ng-show=view.state.userInterface.showInstructors></div></div>"
  );


  $templateCache.put('ModalComment.html',
    "<div class=modal-body><h3 style=\"margin-top: 10px\" class=\"page-header text-center\">Comments</h3><div ng-if=\"instructorComment.length > 0\"><div class=modal-comment-subheader>From Instructor</div><div class=gray-text style=\"margin-top: 10px; border: 1px solid #F2F2F2; padding: 5px\">{{ instructorComment }}</div></div><div class=modal-comment-subheader>From Staff</div><textarea rows=6 class=\"form-control wysihtml5\" ng-model=privateComment style=\"margin-top: 10px\"></textarea></div><div class=\"modal-footer row\" style=\"text-align: center; margin: 0px\"><div style=display:flex><div style=\"flex: 1 1 80%\"></div><div style=\"flex: 1 1 20%\"><button class=\"btn btn-default modal-cancel-btn\" ng-click=cancel()>Cancel</button> <button class=\"btn btn-primary modal-confirm-btn\" ng-click=confirm()>Save</button></div></div></div>"
  );


  $templateCache.put('ModalTeachingCallConfig-old.html',
    "<div class=modal-body><h2 style=\"margin-top: 10px; margin-bottom: 20px\" class=\"page-header text-center\">{{scheduleYear}}-{{scheduleYear + 1}} Teaching Call</h2><div class=row style=margin-bottom:20px ng-show=\"displayedFormPage == 1\"><div class=\"col-xs-4 col-xs-offset-1\"><div class=row><label style=\"margin-right: 10px\">Open For</label><label ng-show=senate class=\"instructor-group-button btn btn-primary ng-untouched ng-valid active ng-dirty ng-valid-parse\" ng-model=startTeachingCallConfig.sentToSenate uib-btn-checkbox=\"\">Senate</label><label ng-show=!senate class=\"instructor-group-button disabled btn btn-default ng-untouched ng-valid active ng-dirtyng-valid-parse\" ng-model=startTeachingCallConfig.sentToSenate uib-btn-checkbox=\"\">Senate</label><label ng-show=federation class=\"instructor-group-button btn btn-primary ng-pristineng-untouched ng-valid\" ng-model=startTeachingCallConfig.sentToFederation uib-btn-checkbox=\"\">Federation</label><label ng-show=!federation class=\"instructor-group-button disabled btn btn-default ng-pristineng-untouched ng-valid\" ng-model=startTeachingCallConfig.sentToFederation uib-btn-checkbox=\"\">Federation</label></div><div class=\"row open-for-container\" style=height:346px><div ng-show=startTeachingCallConfig.sentToFederation><div ng-repeat=\"user in federationInstructors\" style=\"text-align: left\">{{ user | lastCommaFirst }}</div></div><div ng-show=startTeachingCallConfig.sentToSenate><div ng-repeat=\"user in senateInstructors\" style=\"text-align: left\">{{ user | lastCommaFirst }}</div></div></div></div><div class=\"col-xs-5 col-xs-offset-1\" style=padding:0px><div class=row><table style=width:100%><tr><td style=\"padding-right: 15px\"><label>Due Date</label></td><td style=\"width: 80%; right: 0px\"><p class=input-group ng-click=saveDueDate() style=width:100%><input readonly class=form-control ng-click=\"open($event, 1, 'start')\" uib-datepicker-popup={{format}} ng-model=parent.dueDate is-open=opened.start show-button-bar=false min-date=minDate datepicker-options=dateOptions ng-required=true close-text=Close> <span class=input-group-btn><button type=button class=\"btn btn-default\" ng-click=\"open($event, 1, 'start')\"><i class=\"glyphicon glyphicon-calendar\"></i></button></span></p></td></tr><tr><td style=\"padding-right: 15px\"><label>Options</label></td><td><div class=checkbox><label><input type=checkbox ng-model=startTeachingCallConfig.showUnavailabilities> Ask for unavailabilities</label></div></td></tr></table></div><div class=row><div class=col-xs-12 style=padding:0px><label>Terms</label><div class=teaching-call-terms><div class=btn-group ng-repeat=\"term in allTerms\" style=width:100%><label ng-show=isTermActive(term) class=\"instructor-group-button btn btn-primary ng-untouched ng-valid active ng-dirty ng-valid-parse\" ng-model=startTeachingCallConfig.activeTerms[term] uib-btn-checkbox=\"\" style=width:100%>{{getTermName(term)}}</label><label ng-show=!isTermActive(term) class=\"instructor-group-button btn btn-default ng-untouched ng-valid active ng-dirtyng-valid-parse\" ng-model=startTeachingCallConfig.activeTerms[term] uib-btn-checkbox=\"\" style=width:100%>{{getTermName(term)}}</label></div></div></div></div></div></div><div class=row ng-show=\"displayedFormPage == 1\"><div class=\"col-xs-10 col-xs-offset-1\" style=padding:0px><label>Email Message</label><div class=message-template-boilerplate>Instructor Name, <span>will be included in email</span></div><textarea ng-model=startTeachingCallConfig.message id=inputlg type=textarea rows=10 class=form-control></textarea><div class=message-template-boilerplate style=margin-top:10px>Due Date: {{ startTeachingCallConfig.dueDate }} <span>will be included in email</span></div><div class=message-template-boilerplate>https://ipa.ucdavis.edu/teachingCalls <span>will be included in email</span></div><div class=message-template-boilerplate>{{activeTermsDescription()}} <span>Teaching Call will be limited to these terms</span></div></div></div><div ng-show=\"displayedFormPage == 2\" style=\"margin-bottom: 30px\"><label>Teaching Call will be limited to these terms</label><div style=\"margin-bottom: 20px\">{{activeTermsDescription()}}</div><label>Email sent to Instructors</label><div><span style=\"color: gray\">Subject: </span>IPA: Teaching Call has started</div><div><span style=\"color: gray\">Body: </span>Faculty,</div><div>It is time to start thinking about teaching plans for <b>{{scheduleYear}}-{{scheduleYear + 1}}</b></div><div>{{startTeachingCallConfig.message}}</div><div>Please submit your teaching preferences by <b>{{startTeachingCallConfig.dueDate}}</b><div><a href=\"\">View Teaching Call Here</a></div></div></div><div class=\"modal-footer row\" style=\"text-align: center; margin: 0px\"><div class=col-xs-2><button class=\"btn btn-default\" ng-click=cancel()>Cancel</button></div><div class=col-xs-5></div><div class=col-xs-5><button class=\"btn btn-primary\" ng-show=\"displayedFormPage==1\" ng-disabled=isFormIncomplete() ng-click=start(false)>Begin Without Email</button> <button class=\"btn btn-primary\" ng-show=\"displayedFormPage==1\" ng-disabled=isFormIncomplete() ng-click=\"displayedFormPage=2\">Next</button> <button class=\"btn btn-primary\" ng-show=\"displayedFormPage==2\" ng-click=\"displayedFormPage=1\">Back</button> <button class=\"btn btn-primary\" ng-show=\"displayedFormPage==2\" ng-disabled=isFormIncomplete() ng-click=start(true)>Begin and Email</button></div></div></div>"
  );


  $templateCache.put('ModalTeachingCallConfig.html',
    "<div style=\"display: block\" id=modal-1 class=modal><div ng-if=viewState.showPage1 class=\"modal-dialog teaching-call--width\"><div class=modal-content><div class=\"modal-header teaching-call--header_style\"><button type=button class=close data-dismiss=modal aria-hidden=true ng-click=cancel()>×</button><h4 class=modal-title>2016-2017 Teaching Call</h4></div><div class=modal-body><div class=\"row btn-group btn-group--position container-fluid\" data-toggle=buttons><label class=\"instructor-toggle-btn btn btn-sm\" id=courses-pivot ng-if=\"viewState.teachingCalls.eligibleGroups.senateInstructors == true\" ng-click=toggleSenateInstructors() ng-class=\"{'instructor-group-active': startTeachingCallConfig.sentToSenate}\"><input type=checkbox name=options> <span></span> Senate</label><label class=\"instructor-toggle-btn btn btn-sm disabled\" id=courses-pivot ng-if=\"viewState.teachingCalls.eligibleGroups.senateInstructors == false\" data-toggle=tooltip data-placement=top data-original-title=\"Already participating in a Teaching Call\" data-container=body><input type=checkbox name=options> <span></span> Senate</label><label class=\"instructor-toggle-btn btn btn-sm active\" id=courses-pivot ng-if=\"viewState.teachingCalls.eligibleGroups.federationInstructors == true\" ng-click=toggleFederationInstructors() ng-class=\"{'instructor-group-active': startTeachingCallConfig.sentToFederation}\"><input type=checkbox name=options> <span></span> Federation</label><label class=\"instructor-toggle-btn btn btn-sm disabled\" id=courses-pivot ng-if=\"viewState.teachingCalls.eligibleGroups.federationInstructors == false\" data-toggle=tooltip data-placement=top data-original-title=\"Already participating in a Teaching Call\" data-container=body><input type=checkbox name=options> <span></span> Federation</label></div><div class=\"row flex-box container-fluid\"><div class=teaching-call--info_style><div class=\"form-control overflow-auto\" rows=5 id=comment style=\"height: 115px\"><div ng-repeat=\"instructorId in viewState.userInterface.senateInstructorIds\" ng-if=startTeachingCallConfig.sentToSenate>{{ viewState.instructors.list[instructorId].fullName }}</div><div ng-repeat=\"instructorId in viewState.userInterface.federationInstructorIds\" ng-if=startTeachingCallConfig.sentToFederation>{{ viewState.instructors.list[instructorId].fullName }}</div></div><div class=checkbox><label class=checkbox-inline><input type=checkbox ng-model=startTeachingCallConfig.showUnavailabilities>Ask for unavailabilities</label></div></div><div style=\"flex:0 1 5%\"></div><div class=\"teaching-call--info_style container-fluid\"><h5 style=\"margin-top: 0px\">Due Date</h5><p class=input-group><input class=form-control uib-datepicker-popup={{format}} ng-model=startTeachingCallConfig.dueDate is-open=popup1.opened datepicker-options=dateOptions ng-required=true close-text=Close alt-input-formats=altInputFormats popup-placement=bottom-left show-button-bar=false> <span class=input-group-btn><button type=button class=\"btn btn-default\" ng-click=open1()><i class=\"glyphicon glyphicon-calendar\"></i></button></span></p><div><h5>Set Term</h5><div class=btn-group uib-dropdown auto-close=outsideClick is-open=status.isopen><button id=single-button type=button class=\"btn btn-default dropdown-toggle set-terms-teaching-call-btn\" uib-dropdown-toggle ng-disabled=disabled>Set Terms <span class=caret></span></button><ul class=\"dropdown-menu set-term-menu\" uib-dropdown-menu auto-close=outsideClick role=menu aria-labelledby=single-button><li ng-repeat=\"term in viewState.userInterface.enabledTerms.list\" role=menuitem ng-click=toggleTermActive(term) ng-class=\"{'active': startTeachingCallConfig.activeTerms[term.slice(-2)]}\"><a href=#>{{getTermName(term)}}</a></li></ul></div></div></div></div></div><div class=\"modal-footer modal-footer--teaching-call\"><div class=\"email-style container-fluid\"><h5 class=pull-left>Email Message</h5><textarea ng-model=startTeachingCallConfig.message class=form-control placeholder=\"Important: Instructor Name, Due Date, and Quarter Term will all be included.\" rows=5 id=comment></textarea></div><button ng-if=\"isFormIncomplete() == false\" type=button class=\"btn btn-default\" ng-click=createWithoutEmail()>Begin Without Email</button> <button ng-if=\"isFormIncomplete() == true\" type=button class=\"disabled btn btn-default\">Begin Without Email</button> <button ng-if=\"isFormIncomplete() == false\" type=button class=\"btn btn-info\" ng-click=\"viewState.showPage1=false\">Next</button> <button ng-if=\"isFormIncomplete() == true\" type=button class=\"disabled btn btn-info\">Next</button></div></div></div><div ng-if=\"viewState.showPage1 == false\"><div class=\"modal-dialog teaching-call--width\"><div class=modal-content><div class=\"modal-header teaching-call--header_style\"><button type=button class=close data-dismiss=modal aria-hidden=true>×</button><h4 class=modal-title>2016-2017 Teaching Call</h4></div><div class=modal-body><div class=row><div class=container-fluid><h5>Teaching Call will only limited to these terms</h5><span class=muted-term-name ng-repeat=\"term in viewState.userInterface.enabledTerms.list\" role=menuitem ng-if=startTeachingCallConfig.activeTerms[term.slice(-2)]>{{getTermName(term)}}<br></span></div></div></div><div class=\"modal-footer modal-footer--teaching-call\"><div class=row><div class=\"email-style container-fluid\"><h5>Email sent to Instructor</h5><div class=list-group-item><h5 class=text-muted>Subject:</h5><p class=text-muted>Reminder for IPA Due Day</p><h5 class=text-muted ng-model=startTeachingCallConfig.message>Body:</h5><p class=text-muted>Faculties, Just a quick reminder your IPA is due in couple weeks. Pleas complete your IPA assignments by 8/21/16. Any late submission will result in placing into lower priority category. Thanks you!<br>-LINK TO TEACHING CALL-</p></div></div></div><button type=button class=\"btn btn-default\" ng-click=\"viewState.showPage1=true\">Back</button> <button type=button class=\"btn btn-info\" ng-click=createAndEmail()>Create</button></div></div></div></div></div>"
  );


  $templateCache.put('ModalUnavailability.html',
    "<div class=modal-body><h3 style=\"margin-top: 10px; margin-bottom: 20px\" class=\"page-header text-center\">Instructor Unavailabilities</h3><div style=display:flex><div style=\"flex: 1 1 auto; margin-left: 20px\" ng-repeat=\"teachingCallResponse in teachingCallResponses\"><div style=\"text-align: center\">{{ termDisplayNames[teachingCallResponse.termCode.slice(-2)]}}</div><availability-grid blob=teachingCallResponse.availabilityBlob on-change=\"saveUnavailabilities(teachingCallResponse, blob)\" read-only=isScheduleTermLocked(term)></availability-grid></div></div><small class=legend><div class=legend-square style=background-color:#fff></div>Available<div class=legend-square style=background-color:#ccc></div>Unavailable</small></div><div class=\"modal-footer row\" style=\"text-align: center; margin: 0px\"><div style=display:flex><div style=\"flex: 1 1 80%\"></div><div style=\"flex: 1 1 20%\"><button class=\"btn btn-default modal-cancel-btn\" ng-click=cancel()>Close</button></div></div></div>"
  );


  $templateCache.put('TeachingCall.html',
    "<div class=container><div class=\"col-sm-10 col-sm-offset-1\"><h2 class=\"page-header text-center\">Teaching Call {{ year }}-{{ nextYear }}: {{ activeWorkgroup.name }} <small class=\"glyphicon glyphicon-question-sign\" aria-hidden=true tooltip-placement=right uib-tooltip=\"Select the courses you plan to teach for the given term in the order of preference\"></small></h2><table class=\"table teaching-call\"><colgroup><col ng-repeat=\"term in ::view.state.activeTeachingCall.terms track by $index\" span=1 ng-style=\"{ 'width' : 100 / terms.length + '%' }\"></colgroup><tbody><tr><th ng-repeat=\"term in ::view.state.activeTeachingCall.terms track by $index\" disable-element=isScheduleTermLocked(term)>{{ getTermName(term) }}</th></tr><tr><td ng-repeat=\"term in ::view.state.activeTeachingCall.terms track by $index\" disable-element=isScheduleTermLocked(term)><ol sortable drag-end=\"updateAssignmentsOrder(sortedIds, term)\" class=sortable-list><li id=\"pref-{{ preference.id }}\" ng-class=\"{ 'unsortable': preference.approved, 'sortable': !preference.approved}\" ng-repeat=\"preference in view.state.activeTeachingCall.termAssignments[termToTermCode(term)] | orderBy: 'priority' track by preference.id\"><div term-preferences instructor-id=view.state.userInterface.instructorId preference=preference on-select=\"addPreference(preference, courseOffering, isBuyout, isSabbatical, isCourseRelease)\" on-delete=removePreference(preference) on-update=refreshPreferences() schedule-id=activeTeachingCall.scheduleId term=term ng-if=\"!isScheduleTermLocked(term) && !preference.approved\"></div><div uib-tooltip=\"Preference has been approved\" term-preferences instructor-id=instructorId preference=preference courses=courseOfferings[term] schedule-id=teachingCall.scheduleId term=term on-select=\"updatePreference(preference, courseOffering, isBuyout, isSabbatical, isCourseRelease)\" on-delete=deletePreference(preference) on-update=refreshPreferences() ng-if=preference.approved read-only=\"isScheduleTermLocked(term) || preference.approved\"></div></li><li ng-if=\"!teachingCallResponse[term].isComplete && !isScheduleTermLocked(term)\" term-preferences courses=courseOfferings[term] term=term schedule-id=teachingCall.scheduleId class=unsortable instructor-id=instructorId hidden-course-offering-ids=\"{{ getCourseOfferingIdsFromPreferences(termPreferences[term]) }}\" hidden-courses=\"{{ getCoursesFromPreferences(termPreferences[term]) }}\" on-update=refreshPreferences() on-select=\"addPreference(courseOffering, term, isBuyout, isSabbatical, isCourseRelease)\"></li></ol></td></tr></tbody></table><div><div ng-if=view.state.activeTeachingCall.showUnavailabilities><h2 class=\"page-header text-center\">Unavailabilities <small class=\"glyphicon glyphicon-question-sign\" aria-hidden=true tooltip-placement=right uib-tooltip=\"Highlight the blocks of time you are not available\"></small> <small class=legend><div class=legend-square style=background-color:#fff></div>Available<div class=legend-square style=background-color:#ccc></div>Unavailable</small></h2></div><div style=display:flex><div style=\"flex: 1 1 auto; margin-left: 20px\" ng-repeat=\"term in ::view.state.activeTeachingCall.terms track by $index\"><div ng-init=\"teachingCallResponse=view.state.activeTeachingCall.teachingCallResponsesByTermCode[termToTermCode(term)]\"><div style=\"text-align: center\">{{ getTermName(term) }} <span style=\"margin-top: 30px\" class=\"glyphicon glyphicon-transfer text-primary clickable hovrable\" uib-tooltip=\"Copy to all terms\" confirm-button=copyUnabailabilitiesToAllTerms(teachingCallResponse.availabilityBlob) message=\"Are you sure you want to copy this term availabilities to all other terms?\n" +
    "									This will overwrite exisiting availabilities.\" yes=Confirm no=Cancel placement=top></span></div><availability-grid blob=teachingCallResponse.availabilityBlob on-change=\"saveTeachingCallResponse(term, blob, 3000)\" read-only=teachingCallResponse.isComplete></availability-grid></div></div></div></div><div><div style=\"margin-bottom: 10px\"><textarea class=form-control rows=5 ng-model=view.state.activeTeachingCall.teachingCallReceipt.comment placeholder=Comments auto-input on-blur=updateTeachingCallReceipt()>\n" +
    "				</textarea></div><div><div class=\"col-xs-offset-3 col-xs-6\" style=\"margin-bottom: 10px\"><button type=button class=\"btn btn-default btn-block\" confirm-button=updateTeachingCallReceipt(true) confirm-is-enabled=!view.state.activeTeachingCall.teachingCallReceipt.isDone btn-class=btn-primary message=\"Are you sure you want to submit the preferences for this term?\" yes=Confirm no=Cancel placement=top>{{ view.state.activeTeachingCall.teachingCallReceipt.isDone ? 'Update Preferences' : 'Submit Preferences' }}</button></div></div></div></div></div>"
  );


  $templateCache.put('course.html',
    "<!DOCTYPE html><html lang=en><head><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Neon Admin Panel\"><meta name=author content=\"\"><link rel=icon href=/images/favicon.ico><title>IPA Courses</title><link rel=stylesheet href=/css/entypo.css><link rel=stylesheet href=/css/font-awesome.min.css><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/neon-core.css><link rel=stylesheet href=/css/neon-theme.css><link rel=stylesheet href=/css/neon-forms.css><link rel=stylesheet href=/css/shared.css><link rel=stylesheet href=/css/course.css><link rel=stylesheet href=/css/select2-bootstrap.css><link rel=stylesheet href=/css/select2.css><!--[if lt IE 9]><script src=\"assets/js/ie8-responsive-file-warning.js\"></script><![endif]--><!--[if lt IE 9]>\n" +
    "		<script src=\"https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js\"></script>\n" +
    "		<script src=\"https://oss.maxcdn.com/respond/1.4.2/respond.min.js\"></script>\n" +
    "	<![endif]--></head><body class=page-body ng-app=courseApp class=ng-cloak ng-cloak><base href=/courses/ ><div class=\"page-container sidebar-collapsed\" ng-view></div><div id=toast-container class=toast-top-right ng-if=\"$root.toast.message.length > 0\"><div class=\"toast toast-error\" style=\"display: block\"><div class=toast-message ng-bind=$root.toast.message></div></div></div><script src=/js/lib.js></script><script src=/js/sharedApp.js></script><script src=/js/sharedConfig.js></script><script src=/js/courseApp.js></script><script src=/js/Chart.min.js></script></body></html>"
  );


  $templateCache.put('CourseCtrl.html',
    "<nav year=\"{{ year }}\" term-code=\"{{ termCode }}\" workgroup-id=\"{{ workgroupId }}\"></nav><div class=main-content unselect-cell><h3 style=\"text-align: center\">{{ sharedState.workgroup.name }} {{year}} Courses</h3><br><div class=row style=\"margin-bottom: 2em\"><div class=\"col-sm-offset-3 col-sm-6\"><input type=search class=\"form-control hidden-print\" placeholder=\"Search Schedule\" ng-model=view.searchQuery ng-change=filterTable(view.searchQuery)></div></div><div class=\"row hidden-print\"><div class=col-sm-12><div class=table-toolbar><span class=\"tool-icon glyphicon glyphicon-plus\" data-toggle=tooltip data-placement=top data-original-title=Import ng-click=beginImportMode()></span><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-list-alt\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=dropdown-menu multiselect-dropdown items=termDefinitions active-ids=view.state.filters.enabledTerms toggle-item=termToggled(id)></ul></div><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-filter\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=dropdown-menu><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Undergraduate</a></li><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Graduate</a></li><li role=separator class=divider></li><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Published Courses</a></li><li><a href=# class=small data-value=option1 tabindex=-1><input type=checkbox>&nbsp;&nbsp;Unpublished Courses</a></li></ul></div><div class=btn-group><span class=\"tool-icon glyphicon glyphicon-download-alt\" data-toggle=dropdown aria-haspopup=true aria-expanded=false></span><ul class=dropdown-menu><li><a href=# class=small>as Excel</a></li><li><a href=# class=small>as CSV</a></li></ul></div><span class=\"tool-icon glyphicon glyphicon-print\" data-toggle=tooltip data-placement=top data-original-title=Print ng-click=print()></span></div></div></div><div class=\"row hidden-print\" ng-if=view.state.uiState.massImportMode><div class=col-md-12><div class=\"panel panel-primary mass-import-panel\" data-collapsed=0><div class=panel-heading><div class=panel-title>Add Multiple Courses</div><div class=panel-options><a href=# ng-click=endImportMode()><i class=entypo-cancel></i></a></div></div><div class=panel-body><form role=form class=\"form-horizontal form-groups-bordered\"><div class=form-group><label class=\"col-sm-4 control-label\">Subject Code</label><div class=col-sm-4><selectize config=\"{maxItems: 1, valueField: 'code', labelField: 'code', searchField: ['code']}\" options=subjectCodes ng-model=view.state.uiState.massImportCode></selectize></div></div><div class=form-group><label class=\"col-sm-4 control-label\">Academic Year</label><div class=col-sm-4><selectize config=\"{maxItems: 1, valueField: 'year', labelField: 'academicYear', searchField: ['academicYear']}\" options=recentAcademicYears ng-model=view.state.uiState.massImportYear></selectize></div></div><div class=form-group><label class=\"col-sm-4 control-label\"></label><div class=col-sm-4><div class=\"checkbox checkbox-replace color-primary neon-cb-replacement\" ng-click=\"view.state.uiState.massImportPrivate = !view.state.uiState.massImportPrivate\" ng-class=\"{ 'checked': view.state.uiState.massImportPrivate }\"><label class=cb-wrapper><div class=checked></div></label><label>Include unpublished courses</label></div></div></div><div class=form-group><div class=row><div class=\"col-sm-offset-4 col-sm-4\"><button class=\"btn btn-default btn-block\" ng-click=searchImportCourses() ng-disabled=\"!(view.state.uiState.massImportCode && view.state.uiState.massImportYear)\">Search</button></div></div></div></form></div></div></div></div><table course-table class=\"table table-bordered courses-table\"></table></div><div class=\"fixed right-details hidden-print\"><div class=\"panel panel-primary panel-highlight\" ng-if=view.selectedEntity><div class=panel-heading><div class=panel-title><h4 ng-if=\"view.selectedEntityType == 'course'\">{{ view.selectedEntity.subjectCode }} {{ view.selectedEntity.courseNumber }}<br><small>{{ view.selectedEntity.title }}</small></h4><h4 ng-if=\"view.selectedEntityType == 'newCourse'\">New Course</h4><h4 ng-if=\"view.selectedEntityType == 'sectionGroup'\" ng-init=\"parentCourse = view.state.courses.list[view.selectedEntity.courseId]\">{{ parentCourse.subjectCode }} {{ parentCourse.courseNumber }}<br><small>{{ view.selectedEntity.termCode.getTermCodeDisplayName() }}</small></h4></div><div class=panel-options><a ng-click=closeDetails()><i class=entypo-cancel></i></a></div></div><div class=\"panel-body no-padding\"><div class=course-details ng-if=\"view.selectedEntityType == 'course'\"><form role=form class=\"form-horizontal form-groups-bordered\"><div class=right-details-group><div class=row><div class=\"col-sm-10 col-sm-offset-1\"><strong>Title</strong><br><input auto-input class=\"form-control course-title-edit\" on-enter=updateCourse() on-blur=updateCourse() help-text-placement=bottom ng-model=view.selectedEntity.title></div></div></div><div class=right-details-group><div class=row><div class=\"col-sm-10 col-sm-offset-1\"><strong>Tags</strong><br><ui-select multiple ng-model=view.selectedEntity.tagIds theme=bootstrap close-on-select=false on-select=\"addTag($item, $model)\" on-remove=\"removeTag($item, $model)\"><ui-select-match placeholder=\"Select tags...\">{{view.state.tags.list[$item].name}}</ui-select-match><ui-select-choices repeat=\"tagId in view.state.tags.ids | filter:$select.search\"><div ng-bind-html=\"view.state.tags.list[tagId].name | highlight: $select.search\"></div></ui-select-choices></ui-select></div></div></div><div class=right-details-group><div class=row><label class=\"col-sm-3 col-sm-offset-1 control-label\">Sequence</label><div class=col-sm-7><input ng-model=view.selectedEntity.sequencePattern uib-typeahead=\"sequencePattern for sequencePattern in sequencePatterns | filter:$viewValue | limitTo:8\" typeahead-loading=loadingSequences typeahead-no-results=noResults typeahead-editable=false typeahead-on-select=updateCourse() class=\"form-control course-sequence-pattern\"></div></div></div></form></div><div class=course-details ng-if=\"view.selectedEntityType == 'newCourse'\"><form role=form class=\"form-horizontal form-groups-bordered\" ng-if=view.state.courses.newCourse><div class=right-details-group><div class=row><div class=\"col-sm-10 col-sm-offset-1\"><strong>Course</strong><br><input ng-model=selectedCourse placeholder=\"Search courses\" uib-typeahead=\"course as (course.subjectCode + ' ' + course.courseNumber + ' ' + course.title) for course in searchCourses($viewValue)\" typeahead-loading=loadingCourses typeahead-no-results=noResults typeahead-wait-ms=400 typeahead-min-length=2 typeahead-on-select=\"searchCoursesResultSelected($item, $model, $label, $event)\" class=form-control></div></div></div><div class=right-details-group><div class=row><label class=\"col-sm-3 col-sm-offset-1 control-label\">Sequence</label><div class=col-sm-7><input ng-model=view.selectedEntity.sequencePattern uib-typeahead=\"sequencePattern for sequencePattern in sequencePatterns | filter:$viewValue | limitTo:10\" typeahead-loading=loadingSequences typeahead-no-results=noResults typeahead-editable=false class=\"form-control course-sequence-pattern\"></div></div></div><div class=right-details-group><div class=row><div class=\"col-sm-10 col-sm-offset-1\"><button type=button class=\"btn btn-white\" ng-click=closeDetails()>Cancel</button> <button type=button class=\"btn btn-blue pull-right\" ng-click=createCourse() ng-class=\"{ 'disabled': !newCourseIsValid() }\" uib-tooltip=\"All fields are required\" tooltip-enable=!newCourseIsValid()>Create</button></div></div></div></form></div><div class=section-group-details style=\"padding: 1em\" ng-if=\"view.selectedEntityType == 'sectionGroup'\"><census-chart census=view.state.courses.list[view.selectedEntity.courseId].census schedule-term-state=view.state.scheduleTermStates.list[view.selectedEntity.termCode] course-id=view.selectedEntity.courseId></census-chart><hr><table class=\"table sections-table\" style=\"margin-bottom: 5px\" ng-if=view.selectedEntity.sectionIds.length><colgroup><col span=1 style=\"width: 30%\"><col span=1 style=\"width: 30%\"><col span=1 style=\"width: 10%\"></colgroup><thead><tr><th>Section</th><th>Seats</th><th></th></tr></thead><tbody><tr ng-repeat=\"sectionId in view.selectedEntity.sectionIds track by $index\"><td>{{ view.state.sections.list[sectionId].sequenceNumber }}</td><td><input auto-input type=number class=\"form-control section-seats-edit text-center\" on-enter=updateSection(view.state.sections.list[sectionId]) on-blur=updateSection(view.state.sections.list[sectionId]) help-text-placement=left ng-model=view.state.sections.list[sectionId].seats></td><td><a class=\"text-danger clickable\" uib-tooltip=Delete confirm-button=deleteSection(view.state.sections.list[sectionId]) message=\"Are you sure you want to remove this section\" yes=Delete no=Cancel placement=left><i class=entypo-cancel-squared></i></a></td></tr><tr ng-if=\"view.selectedEntity.sectionIds.length > 1\"><td><strong>Total</strong></td><td class=text-center>{{ sectionSeatTotal(view.selectedEntity) }}</td><td></td></tr></tbody></table><div ng-if=\"view.selectedEntity.sectionIds.length == 0\" class=\"text-center text-muted\" style=\"padding: 1em\">No sections available</div><div class=\"col-sm-12 text-center\" ng-if=nextSequence()><button class=\"btn btn-white\" uib-tooltip=\"Add a section\" tooltip-placement=right ng-click=addSection()>Create {{ nextSequence() }}</button></div><div class=\"col-sm-12 text-center\" ng-if=!view.selectedEntity.id><p>No Course Offering for {{view.selectedEntity.termCode.getTermCodeDisplayName()}}</p><button class=\"btn btn-primary\" ng-click=addSectionGroup()>Create Offering</button></div></div></div></div><div class=\"panel panel-primary panel-highlight\" ng-if=view.state.uiState.massImportMode><div class=panel-heading><div class=panel-title><h4>Add Multiple Courses</h4></div></div><div class=\"panel-body no-padding\"><div class=\"col-sm-12 import-summary\"><div ng-hide=view.state.courses.importList>Please search for courses to import</div><div ng-show=view.state.courses.importList>Courses are being imported</div></div></div></div></div>"
  );


  $templateCache.put('index.html',
    "<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Academic planning for UC Davis\"><meta name=author content=\"UC Davis Division of Social Science IT Development Team\"><title>Instructional Planning and Administration</title><link rel=stylesheet href=/css/lib.css><style>html {\n" +
    "			width: 100%;\n" +
    "			height: 100%;\n" +
    "		}\n" +
    "		body {\n" +
    "			background-image: url(\"/images/welcome_splash.jpg\");\n" +
    "			background-size: cover;\n" +
    "		}\n" +
    "\n" +
    "		.jumbotron h1 {\n" +
    "			color: #fff;\n" +
    "		}\n" +
    "\n" +
    "		.jumbotron p.lead {\n" +
    "			color: #eee;\n" +
    "		}\n" +
    "\n" +
    "		.jumbotron {\n" +
    "			background-color: transparent;\n" +
    "			padding-top: 80px;\n" +
    "		}\n" +
    "\n" +
    "		.btn {\n" +
    "			width: 75px;\n" +
    "		}</style></head><body><div class=\"container col-sm-8 col-sm-offset-2\"><div class=masthead style=\"margin-bottom: 3em\"><div class=pull-left style=\"margin-top: 2em\"><img src=/images/ucdlogogray.png></div><a href=/summary.html style=\"margin-top: 2em; background-color: transparent; border-color: #eee\" class=\"pull-right btn btn-large btn-success\">Log in</a></div><div class=\"jumbotron text-center\"><h1>Instructional Planning and Administration</h1><p class=lead>Schedule courses, analyze enrollment, message instructors, and more.</p><p class=lead><a href=/learn.html style=\"margin-top: 2em; width: 200px\" class=\"btn btn-lg btn-primary\">Learn More</a> <a href=/announcements.html style=\"margin-top: 2em; width: 200px\" class=\"btn btn-lg btn-primary\">Announcements</a></p></div></div></body></html>"
  );


  $templateCache.put('not-found.html',
    "<!DOCTYPE html><html lang=en style=\"height: 100%\"><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Academic planning for UC Davis\"><meta name=author content=\"UC Davis Division of Social Science IT Development Team\"><title>Instructional Planning and Administration</title><link rel=stylesheet href=/css/lib.css></head><body style=\"background-color: rgb(238, 238, 238)\"><div class=jumbotron style=\"text-align: center; height: 100%\"><h1>Oops!</h1><p class=lead>We can't seem to find the page you're looking for.</p><p class=lead><br><a href=/ >Back to Home page</a></p></div></body></html>"
  );


  $templateCache.put('scheduling.html',
    "<!DOCTYPE html><html lang=en><head><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Neon Admin Panel\"><meta name=author content=\"\"><link rel=icon href=/images/favicon.ico><title>IPA Scheduling</title><link rel=stylesheet href=/css/entypo.css><link rel=stylesheet href=/css/font-awesome.min.css><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/neon-core.css><link rel=stylesheet href=/css/neon-theme.css><link rel=stylesheet href=/css/neon-forms.css><link rel=stylesheet href=/css/shared.css><link rel=stylesheet href=/css/scheduling.css><!--[if lt IE 9]><script src=\"assets/js/ie8-responsive-file-warning.js\"></script><![endif]--><!--[if lt IE 9]>\n" +
    "		<script src=\"https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js\"></script>\n" +
    "		<script src=\"https://oss.maxcdn.com/respond/1.4.2/respond.min.js\"></script>\n" +
    "	<![endif]--></head><body class=page-body ng-app=schedulingApp class=ng-cloak ng-cloak><base href=/scheduling/ ><div class=\"page-container sidebar-collapsed\" ng-view></div><div id=toast-container class=toast-top-right ng-if=\"$root.toast.message.length > 0\"><div class=\"toast toast-error\" style=\"display: block\"><div class=toast-message ng-bind=$root.toast.message></div></div></div><script src=/js/lib.js></script><script src=/js/sharedApp.js></script><script src=/js/sharedConfig.js></script><script src=/js/schedulingApp.js></script></body></html>"
  );


  $templateCache.put('SchedulingCtrl.html',
    "<nav year=\"{{ year }}\" term-code=\"{{ termCode }}\" workgroup-id=\"{{ workgroupId }}\"></nav><div class=wrap><div class=main-content><div class=activity-page-header><div class=activity-page-title><h3>{{ term.fullDescription }}</h3></div><div class=activity-filters><div class=activity-filter-menu><div class=\"btn-group pull-right\"><button class=\"btn btn-white btn-block dropdown-toggle\" type=button data-toggle=dropdown aria-haspopup=true aria-expanded=false>Filters <span class=caret></span></button><div class=dropdown-menu style=\"width: 400px; padding: 0\"><div class=filters-container stop-event=click><div class=tags-filter><h3>Tags</h3><ul><li ng-repeat=\"tagId in view.state.tags.ids track by $index\" ng-click=toggleTagFilter(tagId)><div class=\"checkbox checkbox-replace color-primary neon-cb-replacement\" ng-class=\"{ 'checked': view.state.filters.enabledTagIds.indexOf(tagId) >= 0 }\"><label class=cb-wrapper ng-style=\"{ 'border-color': view.state.tags.list[tagId].color }\"><div class=checked ng-style=\"{ 'background': view.state.tags.list[tagId].color }\"></div></label><label ng-bind=view.state.tags.list[tagId].name></label></div></li></ul></div><div class=days-filter><h3>Days</h3><ul><li ng-repeat=\"day in ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] track by $index\" ng-click=toggleCalendarDay($index)><div class=\"checkbox checkbox-replace color-primary neon-cb-replacement\" ng-class=\"{ 'checked': view.state.filters.hiddenDays.indexOf($index) < 0 }\"><label class=cb-wrapper><div class=checked></div></label><label>{{ day }}</label></div></li></ul></div></div></div></div></div><div class=activity-filter-tokens><div class=\"label label-info\" ng-repeat=\"sectionGroupId in view.state.uiState.checkedSectionGroupIds track by $index\" ng-init=\"sg = view.state.sectionGroups.list[sectionGroupId];\">{{ view.state.courses.list[sg.courseId].subjectCode }} {{ view.state.courses.list[sg.courseId].courseNumber }} - {{ view.state.courses.list[sg.courseId].sequencePattern }} <i class=\"glyphicon glyphicon-remove clickable hoverable\" ng-click=toggleCheckedSectionGroup(sectionGroupId)></i></div></div></div></div><div class=section-group-container><div class=section-group-list ng-class=\"{ 'collapsed': view.state.uiState.selectedSectionGroupId }\"><ul><li class=section-group-item ng-repeat=\"sectionGroupId in view.state.sectionGroups.ids track by $index\" ng-init=\"sg = view.state.sectionGroups.list[sectionGroupId];\" ng-show=\"view.state.courses.list[sg.courseId].matchesTagFilters || view.state.filters.enabledTagIds.length == 0\" ng-class=\"{ 'active': view.state.uiState.selectedSectionGroupId == sectionGroupId }\" ng-click=setSelectedSectionGroup(sectionGroupId)><div class=section-group-check ng-if=\"view.state.uiState.selectedSectionGroupId != sectionGroupId\" ng-click=toggleCheckedSectionGroup(sectionGroupId) stop-event=click><i ng-show=\"view.state.uiState.checkedSectionGroupIds.indexOf(sectionGroupId) >= 0\" class=\"sg-checkbox fa fa-check-square-o\"></i> <i ng-hide=\"view.state.uiState.checkedSectionGroupIds.indexOf(sectionGroupId) >= 0\" class=\"sg-checkbox fa fa-square-o\"></i></div><div class=section-group-check ng-if=\"view.state.uiState.selectedSectionGroupId == sectionGroupId\"></div><div class=section-group-description><span>{{ view.state.courses.list[sg.courseId].subjectCode }} {{ view.state.courses.list[sg.courseId].courseNumber }} - {{ view.state.courses.list[sg.courseId].sequencePattern }}</span><br><small class=text-muted>{{ view.state.courses.list[sg.courseId].title }}</small><br><small class=text-muted>Units: {{ view.state.courses.list[sg.courseId].unitsLow }}<div ng-if=view.state.courses.list[sg.courseId].tagIds.length>Tags:<div class=label style=\"padding: 3px; margin-left: 3px\" ng-repeat=\"tagId in view.state.courses.list[sg.courseId].tagIds track by $index\" ng-style=\"{ 'background-color': view.state.tags.list[tagId].color || '#333', 'color': view.state.tags.list[tagId].getTextColor() }\">{{ view.state.tags.list[tagId].name }}</div></div></small></div></li></ul></div><div class=activity-container ng-class=\"{ 'collapsed': !view.state.uiState.selectedSectionGroupId }\"><div class=activity-list ng-class=\"{ 'collapsed': view.state.uiState.selectedActivityId }\"><div ng-if=view.state.uiState.selectedSectionGroupId><p class=activity-list-header>{{ view.state.courses.list[view.state.uiState.selectedCourseId].subjectCode }} {{ view.state.courses.list[view.state.uiState.selectedCourseId].courseNumber }} - {{ view.state.courses.list[view.state.uiState.selectedCourseId].sequencePattern }}</p><div class=section-pattern>All Sections</div><ul ng-repeat=\"sharedActivityId in view.state.sectionGroups.list[view.state.uiState.selectedSectionGroupId].sharedActivityIds track by $index\" class=activity-group ng-init=\"sharedActivity = view.state.activities.list[sharedActivityId];\"><li class=activity-item ng-class=\"{ 'active': view.state.uiState.selectedActivityId == sharedActivityId }\" ng-click=setSelectedActivity(sharedActivityId)><span>{{ sharedActivity.getCodeDescription() }}</span> <i class=\"entypo-minus-circled pull-right delete-activity clickable hoverable\" ng-class=\"{ 'text-danger': view.state.uiState.selectedActivityId != sharedActivityId }\" uib-tooltip=\"Remove shared {{ sharedActivity.getCodeDescription() }}\" tooltip-append-to-body=true confirm-button=removeActivity(sharedActivity) message=\"Are you sure you want to remove this {{ sharedActivity.getCodeDescription() }}\" yes=Delete no=Cancel placement=right></i></li><li class=add-activity><i class=\"entypo-plus-circled text-success clickable hoverable\" uib-tooltip=\"Add new shared {{ sharedActivity.getCodeDescription() }}\" tooltip-placement=right tooltip-append-to-body=true ng-click=\"createSharedActivity(sharedActivity, view.state.sectionGroups.list[view.state.uiState.selectedSectionGroupId])\"></i></li></ul><ul><li class=section-item ng-repeat=\"sectionId in view.state.sectionGroups.list[view.state.uiState.selectedSectionGroupId].sectionIds\" ng-init=\"section = view.state.sections.list[sectionId];\"><div class=section-pattern>Section {{ section.sequenceNumber }}</div><ul class=activity-group ng-repeat=\"activityId in section.activityIds track by $index\" ng-init=\"activity = view.state.activities.list[activityId];\"><li class=activity-item ng-class=\"{ 'active': view.state.uiState.selectedActivityId == activityId }\" ng-click=setSelectedActivity(activityId)><span>{{ activity.getCodeDescription() }}</span> <i class=\"entypo-minus-circled pull-right delete-activity clickable hoverable\" ng-class=\"{ 'text-danger': view.state.uiState.selectedActivityId != sharedActivityId }\" uib-tooltip=\"Remove {{ activity.getCodeDescription() }}\" tooltip-append-to-body=true confirm-button=removeActivity(activity) message=\"Are you sure you want to remove this {{ activity.getCodeDescription() }}\" yes=Delete no=Cancel placement=right></i> <i class=\"glyphicon glyphicon-warning-sign pull-right text-warning\" uib-tooltip=\"Activity no longer matches standard pattern\" ng-show=\"activityId == view.state.uiState.selectedActivityId && view.state.uiState.selectedActivity.hasWarning\"></i></li><li class=add-activity><i class=\"entypo-plus-circled text-success clickable hoverable\" uib-tooltip=\"Add new {{ sharedActivity.getCodeDescription() }}\" tooltip-placement=right tooltip-append-to-body=true ng-click=\"createActivity(activity, view.state.sectionGroups.list[view.state.uiState.selectedSectionGroupId])\"></i></li></ul></li></ul></div></div><div class=activity-details ng-class=\"{ 'collapsed': !view.state.uiState.selectedActivityId }\"><div ng-show=view.state.uiState.selectedActivityId><p class=activity-details-header>{{ view.state.activities.list[view.state.uiState.selectedActivityId].getCodeDescription() }}</p><form class=form-horizontal><strong>Location</strong><hr style=\"margin: 0 0 5px 0\"><div class=form-group><div class=col-sm-12><div class=radio><label><input type=radio ng-value=true ng-click=clearLocation() ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].isBannerRoom> Banner Selected</label></div><div class=radio><label><input type=radio ng-value=false ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].isBannerRoom> Custom</label></div><div ng-show=!view.state.activities.list[view.state.uiState.selectedActivityId].isBannerRoom><ui-select ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].locationId theme=bootstrap search-enabled=false close-on-select=true on-select=saveActivity()><ui-select-match placeholder=\"Select location...\">{{ view.state.locations.list[view.state.activities.list[view.state.uiState.selectedActivityId].locationId].description }}</ui-select-match><ui-select-choices repeat=\"locationId in view.state.locations.ids track by $index\"><div ng-bind-html=\"view.state.locations.list[locationId].description | highlight: $select.search\"></div></ui-select-choices></ui-select></div></div></div><strong>Time</strong><hr style=\"margin: 0 0 5px 0\"><div class=form-group><div class=col-sm-12><div class=radio><label><input type=radio name=buildingRadios ng-value=true ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].isStandardTimes>Standard times</label></div><div ng-show=view.state.activities.list[view.state.uiState.selectedActivityId].isStandardTimes><fieldset><div class=col-sm-4 style=\"padding: 0px\"><select size=4 class=\"form-control standard-time\" ng-options=\"duration as (duration + ' min') for (duration,pattern) in standardPatterns\" ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].selectedDuration></select></div><div class=\"control-group col-sm-3\" style=\"padding: 0px 0px 0px 5px\"><select size=4 class=\"form-control standard-time\" ng-options=\"dayIndicator as getWeekDays(dayIndicator, standardPatterns[view.state.activities.list[view.state.uiState.selectedActivityId].selectedDuration].dayIndicators)\n" +
    "												for dayIndicator in standardPatterns[view.state.activities.list[view.state.uiState.selectedActivityId].selectedDuration].dayIndicators\" ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].dayIndicator></select></div><div class=\"control-group col-sm-5\" style=\"padding: 0px 0px 0px 5px\"><select size=4 class=\"form-control standard-time\"><option ng-repeat=\"time in standardPatterns[view.state.activities.list[view.state.uiState.selectedActivityId].selectedDuration].times\" ng-selected=\"time.start === view.state.activities.list[view.state.uiState.selectedActivityId].startTime && time.end === view.state.activities.list[view.state.uiState.selectedActivityId].endTime\" ng-click=setActivityStandardTime(time)>{{ getMeridianTime(time.start) }} - {{ getMeridianTime(time.end) }}</option></select></div></fieldset></div><div class=radio><label><input type=radio name=buildingRadios ng-value=false ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].isStandardTimes>Non-standard times</label></div><div ng-hide=view.state.activities.list[view.state.uiState.selectedActivityId].isStandardTimes><div class=form-group><div class=input-group><label class=\"col-sm-6 control-label\" style=\"padding-right: 0\">Repeats every: &nbsp;</label><div class=col-sm-5 style=\"padding-left: 0\"><div class=\"input-group input-group-sm\"><input auto-input type=number class=form-control on-enter=saveActivity() on-blur=saveActivity() help-text-placement=top ng-model=view.state.activities.list[view.state.uiState.selectedActivityId].frequency> <span class=input-group-addon>weeks</span></div></div></div></div><div class=form-group><div class=\"col-sm-offset-1 col-sm-10\"><div class=\"btn-group btn-group-justified btn-group-xs\"><div class=\"btn-group ng-scope\" ng-repeat=\"day in days track by $index\"><button ng-click=toggleActivityDay($index) ng-class=\"{'active': view.state.activities.list[view.state.uiState.selectedActivityId].dayIndicator[$index] === '1'}\" type=button class=\"btn btn-default ng-binding\">{{day}}</button></div></div></div></div><div class=form-group><div class=\"col-sm-offset-1 col-sm-5 text-center\"><time-input time=view.state.activities.list[view.state.uiState.selectedActivityId].startTime minute-step=5 on-change-delay=500 on-change=saveActivity()></time-input></div><div class=\"col-sm-5 text-center\"><time-input time=view.state.activities.list[view.state.uiState.selectedActivityId].endTime minute-step=5 on-change-delay=500 on-change=saveActivity()></time-input></div></div></div></div></div></form></div></div></div><div class=activity-calendar><term-calendar></term-calendar></div></div></div></div>"
  );


  $templateCache.put('timeInput.html',
    "<table style=\"margin: auto\"><tbody><tr class=text-center><td><a ng-click=incrementHours() class=\"btn btn-link btn-sm btn-sm-padding\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td><td>&nbsp;</td><td><a ng-click=incrementMinutes() class=\"btn btn-link btn-sm btn-sm-padding\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td><td></td></tr><tr><td class=form-group><input ng-value=getMeridianTime().hours class=\"form-control input-sm input-sm-padding text-center\" ng-readonly=true maxlength=2></td><td>:</td><td class=form-group><input ng-value=\"('0' + getMeridianTime().minutes).slice(-2)\" class=\"form-control input-sm input-sm-padding text-center\" ng-readonly=true maxlength=2></td><td><button type=button class=\"btn btn-default btn-sm btn-sm-padding text-center\" ng-click=toggleMeridian()>{{ getMeridianTime().meridian }}</button></td></tr><tr class=text-center><td><a ng-click=decrementHours() class=\"btn btn-link btn-sm btn-sm-padding\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td><td>&nbsp;</td><td><a ng-click=decrementMinutes() class=\"btn btn-link btn-sm btn-sm-padding\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td><td></td></tr></tbody></table>"
  );


  $templateCache.put('availabilityGrid.html',
    "<table class=\"table availability-grid\"><thead><tr><th></th><th ng-repeat=\"day in days\">{{ day }}</th></tr></thead><tbody><tr ng-repeat=\"(h, hour) in hours track by $index\"><th class=left>{{ hour }}</th><td ng-repeat=\"(d, day) in days\" class=clickable data-day={{d}} data-hour={{h}} ng-class=\"{'unavailable': availability[d][h] == 0, 'available': availability[d][h] == 1}\"></td></tr></tbody></table>"
  );


  $templateCache.put('modalAddUnscheduledCourse.html',
    "<div class=modal-header><h2 style=\"text-align: center\">Add Course Preference to {{getTermName(term)}}</h2></div><div class=modal-body><input ng-model=newCourse placeholder=\"Course Title\" focus-on-show ng-init=\"noResults = false\" ng-change=clearSearch() uib-typeahead=\"course.fullDesc for course in searchCourses($viewValue)\" typeahead-min-length=3 typeahead-wait-ms=300 class=form-control typeahead-no-results=noResults uib-tooltip=\"No Results\" tooltip-placement=bottom tooltip-is-open=noResults tooltip-trigger=none typeahead-on-select=\"setCourse($item, $model, $label)\" auto-input></div><div class=modal-footer><button class=\"btn btn-primary\" ng-disabled=isFormIncomplete() ng-click=ok()>Add Course Preference</button> <button class=\"btn btn-default\" ng-click=cancel()>Cancel</button></div>"
  );


  $templateCache.put('multiselectDropdown.html',
    "<li ng-repeat=\"item in items\"><a href=# class=small data-value=\"{{ item.id }}\" tabindex=-1 ng-click=\"selectItem($event, item.id)\"><input type=checkbox ng-checked=\"activeIds.indexOf(item.id) != -1\" style=\"pointer-events: none\">&nbsp;&nbsp;{{ item.description }}</a></li>"
  );


  $templateCache.put('nav.html',
    "<div class=sidebar-menu><div class=sidebar-menu-inner><header class=logo-env><div class=logo><a ng-href=\"/summary/{{ workgroupId }}/{{ year }}/{{ term.code }}\"><h1 style=\"color: #fff; margin:0\">IPA</h1></a></div><div class=sidebar-collapse><a href=# class=sidebar-collapse-icon><i class=entypo-menu></i></a></div><div class=\"sidebar-mobile-menu visible-xs\"><a href=# class=with-animation><i class=entypo-menu></i></a></div></header><ul id=main-menu class=main-menu><li class=welcome><span class=title>Howdy, {{ sharedState.displayName }}</span></li><li><a ng-click=logout()><i class=entypo-logout></i> <span class=title>Logout</span></a></li><li><a href=\"/workgroups/{{ sharedState.workgroup.id }}/{{ sharedState.year }}/{{ term.code }}\"><i class=entypo-users></i> <span class=title ng-if=\"sharedState.userWorkgroups.length > 1\">Workgroups</span> <span class=title ng-if=\"sharedState.userWorkgroups.length == 1\">{{ sharedState.workgroup.name }}</span></a><ul class=visible ng-if=\"sharedState.userWorkgroups.length > 1\"><li ng-repeat=\"workgroup in sharedState.userWorkgroups track by workgroup.id\" ng-class=\"{ 'active': sharedState.workgroup.id == workgroup.id }\"><a ng-href=\"/workgroups/{{ workgroup.id }}/{{ sharedState.year }}/{{ term.code }}\"><span class=title>{{ workgroup.name }}</span></a></li></ul></li></ul><ul class=\"pager year-switcher\"><li class=previous><a ng-click=changeYearBy(-1)><i class=\"entypo-left-open-mini clickable hoverable\"></i></a></li><li><a>{{ year }}</a></li><li class=next><a ng-click=changeYearBy(1)><i class=\"entypo-right-open-mini clickable hoverable\"></i></a></li></ul><ul id=main-menu class=main-menu><li><a ng-href=\"/courses/{{ workgroupId }}/{{ year }}/{{ term.code }}\"><i class=entypo-book></i> <span class=title>Courses</span></a></li><li><a ng-href=\"/assignments/{{ workgroupId }}/{{ year }}/{{ term.code }}\"><i class=entypo-user-add></i> <span class=title>Assignments</span></a></li><li><a href=#><i class=entypo-calendar></i> <span class=title>Scheduling</span></a><ul class=visible><li ng-repeat=\"term in termDefinitions track by term.id\" ng-class=\"{'active': term.code == termCode}\"><a ng-href=\"/scheduling/{{ workgroupId }}/{{ year }}/{{ term.code }}\">{{ term.description }}</a></li></ul></li></ul></div></div>"
  );


  $templateCache.put('searchableMultiselect.html',
    "<div class=\"dropdown searchable-multi-select hidden-print\" uib-dropdown is-open=isExpanded uib-tooltip=\"{{ commaDelimitedSelected() }}\" tooltip-enable=!isExpanded stop-event=click><a class=\"dropdown-toggle btn\" uib-dropdown-toggle ng-class=\"{'disabled': readOnly}\"><span style=\"text-overflow: ellipsis; white-space: nowrap; overflow: hidden\"><small class=text-muted>{{ commaDelimitedSelected() }} </small><b class=\"caret text-muted\" ng-if=\"!readOnly && allItems.length\"></b></span></a><ul ng-if=\"!readOnly && allItems.length && isExpanded\" class=\"dropdown-menu dropdown-menu-form form-control list-group\"><li class=\"list-group-item dropdown-list-item\" style=\"background-color: #eee\" ng-if=\"isSearchable !== 'false'\"><input class=form-control ng-model=searchQuery placeholder=Search></li><li ng-repeat=\"item in allItems | orderBy:displayAttr track by $index\" class=\"clickable list-group-item dropdown-list-item\" ng-hide=\"searchQuery.length && item[displayAttr].toLowerCase().indexOf(searchQuery.toLowerCase()) < 0\" ng-click=updateSelectedItems(item) ng-class=\"{'active': isItemSelected(item) }\">{{ item[displayAttr] }} <span class=\"glyphicon glyphicon-ok pull-right\" ng-show=isItemSelected(item)></span></li><li ng-if=canAdd class=\"list-group-item dropdown-list-item\" style=\"background-color: #eee\"><input class=form-control auto-input on-enter=\"addItem({itemName: newItemName})\" clear-on-init=true maxlength=100 ng-model=newItemName placeholder=Add... help-text-placement=bottom></li></ul></div><div class=visible-print-block>{{ commaDelimitedSelected() }}</div>"
  );


  $templateCache.put('sessionTimedout.html',
    "<div class=\"modal-body text-center\"><h2 class=\"page-header text-center\">Your session timed out.</h2><a ng-href={{rootUrl}}/ class=\"btn btn-primary\">Log in again</a></div>"
  );


  $templateCache.put('sessionWarning.html',
    "<div idle-countdown=countdown ng-init=\"countdown=60\" class=\"modal-body text-center\"><h2 class=\"page-header text-center\">Your session is about to time out</h2><uib-progressbar max=60 value=countdown animate=false class=\"progress-striped active\" type=danger>You'll be logged out in {{countdown}} second{{countdown > 1 ? 's' : ''}}.</uib-progressbar>Click anywhere to keep the session alive</div>"
  );


  $templateCache.put('termPreferences.html',
    "<div uib-dropdown is-open=status.dropDownIsOpen><button ng-if=!preference class=\"btn btn-default dropdown-toggle term-preference-dropdown\" type=button id=dropdownMenu1 uib-dropdown-toggle ng-disabled=readOnly style=\"width: 88%\"><span class=dropdown-text>{{ getDescription(preference) }} </span><span class=caret></span></button><div ng-if=\"preference && preference.approved\" class=\"approved-preference alert alert-info tile-assignment preference-display\"><div class=preference-display-detail>{{ getDescription(preference) }}</div></div><div ng-if=\"preference && !preference.approved\" class=\"unapproved-preference alert alert-info tile-assignment preference-display\"><div class=preference-display-detail>{{ getDescription(preference) }}</div></div><ul class=\"dropdown-menu dropdown-short\" role=menu aria-labelledby=dropdownMenu1 ng-if=status.dropDownIsOpen><li role=presentation class=clickable><a role=menuitem ng-click=\"onSelect({isBuyout: true})\"><strong style=\"padding-left: 43px\">BUYOUT</strong></a></li><li role=presentation class=clickable><a role=menuitem ng-click=\"onSelect({isCourseRelease: true})\"><strong style=\"padding-left: 43px\">COURSE RELEASE</strong></a></li><li disable-element=\"disableSabbatical && !preference.isSabbatical\" role=presentation class=clickable ng-class=\"{ 'active': preference.isSabbatical }\" uib-tooltip=\"{{ sabbaticalDisableMessage }}\" tooltip-enable=\"disableSabbatical && !preference.isSabbatical\"><a role=menuitem ng-click=\"onSelect({isSabbatical: true})\"><strong style=\"padding-left: 43px\">SABBATICAL</strong></a></li><li ng-repeat=\"course in courses | orderBy: ['subjectCode','courseNumber','title'] track by $index\" ng-if=\"course.hasPreference == false\" role=presentation class=clickable><a role=menuitem ng-click=\"onSelect({courseOffering: course})\"><span class=badge style=\"background-color: #aaa; width: 40px\">{{ course.seatsTotal }}</span> {{ course.subjectCode }} {{ course.courseNumber }} {{ course.title }}</a></li></ul></div><span ng-if=\"preference && !preference.approved\" confirm-button=onDelete() message=\"Are you sure you want to delete this preference\" yes=Delete no=Cancel placement=bottom confirm-is-shown=status.confirmIsOpen class=\"glyphicon glyphicon-remove sortable-item-button close\" aria-hidden=true style=\"width: 10%\" uib-tooltip=Remove tooltip-placement=right></span>"
  );


  $templateCache.put('summary.html',
    "<!DOCTYPE html><html lang=en><head><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Neon Admin Panel\"><meta name=author content=\"\"><link rel=icon href=/images/favicon.ico><title>IPA Summary</title><link rel=stylesheet href=/css/entypo.css><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/neon-core.css><link rel=stylesheet href=/css/neon-theme.css><link rel=stylesheet href=/css/neon-forms.css><link rel=stylesheet href=/css/timeline.css><link rel=stylesheet href=/css/shared.css><link rel=stylesheet href=/css/summary.css><!--[if lt IE 9]><script src=\"assets/js/ie8-responsive-file-warning.js\"></script><![endif]--><!--[if lt IE 9]>\n" +
    "		<script src=\"https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js\"></script>\n" +
    "		<script src=\"https://oss.maxcdn.com/respond/1.4.2/respond.min.js\"></script>\n" +
    "	<![endif]--></head><body class=page-body data-url=http://neon.dev ng-app=summaryApp><base href=/summary/ ><div class=\"page-container sidebar-collapsed\" ng-view></div><script src=/js/lib.js></script><script src=/js/sharedApp.js></script><script src=/js/sharedConfig.js></script><script src=/js/summaryApp.js></script></body></html>"
  );


  $templateCache.put('SummaryCtrl.html',
    "<nav></nav><div class=main-content><div class=\"left-container padded-container\"><h2>Planning At A Glance</h2><br><ul class=cbp_tmtimeline><li><time class=cbp_tmtime datetime=2015-11-04T18:30><span class=hidden>04/11/2015</span> <span class=large>Now</span></time><div class=cbp_tmicon><i class=entypo-info></i></div><div class=\"cbp_tmlabel empty\"></div></li><li><time class=cbp_tmtime><span>12:00 AM</span> <span>5/26/2016</span></time><div class=\"cbp_tmicon bg-success\"><i class=entypo-graduation-cap></i></div><div class=cbp_tmlabel><h2>Spring Quarter Started</h2></div></li><li><time class=cbp_tmtime><span>01:22 PM</span> <span>4/12/2016</span></time><div class=\"cbp_tmicon bg-secondary\"><i class=entypo-bell></i></div><div class=cbp_tmlabel><h2>Summer Session I Upload Available</h2></div></li><li><time class=cbp_tmtime><span>12:13 PM</span> <span>3/27/2016</span></time><div class=\"cbp_tmicon bg-info\"><i class=entypo-users></i></div><div class=cbp_tmlabel><h2>Teaching Call 2017 Started</h2><p>Send to Federation and Senate Instructors</p><p><a href=http://ipa.ucdavis.edu/teachingCall/11/ >View the teaching call</a></p></div></li></ul></div><div class=\"right-container right-info padded-container\"><h3>Notices</h3><ul class=notifications-menu><li class=top><p class=small>You have <strong>3</strong> new warnings.</p></li><li><ul class=\"dropdown-menu-list scroller\" tabindex=5001 style=\"overflow: hidden; outline: none\"><li class=\"unread notification-warning\"><a href=courses.html><i class=\"entypo-book pull-right\"></i> <span class=line><strong>Section total is different from planned seats</strong> </span><span class=\"line small\">30 seconds ago</span></a></li><li class=\"unread notification-warning\"><a href=assignments.html><i class=\"entypo-user-add pull-right\"></i> <span class=line><strong>Bob Sagit is not assigned any courses for Winter 2016</strong> </span><span class=\"line small\">2 minutes ago</span></a></li><li class=notification-danger><a href=scheduling.html><i class=\"entypo-calendar pull-right\"></i> <span class=line><strong>PSC 113 B Series was denied the time requested</strong> </span><span class=\"line small\">3 hours ago</span></a></li></ul></li><li class=external><a href=#>View all notifications</a></li></ul></div></div>"
  );


  $templateCache.put('unknown-error.html',
    "<!DOCTYPE html><html lang=en style=\"height: 100%\"><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Academic planning for UC Davis\"><meta name=author content=\"UC Davis Division of Social Science IT Development Team\"><title>Instructional Planning and Administration</title><link rel=stylesheet href=/css/lib.css></head><body style=\"background-color: rgb(238, 238, 238)\"><div class=jumbotron style=\"text-align: center; height: 100%\"><h1>Uh oh.</h1><p class=lead>We encountered an error we were not prepared for.</p><p class=lead><br>Please <a href=https://it.dss.ucdavis.edu/ >report this to IT</a>.</p></div></body></html>"
  );


  $templateCache.put('WorkgroupCtrl.html',
    "<nav year=\"{{ year }}\" term-code=\"{{ termCode }}\" workgroup-id=\"{{ workgroupId }}\"></nav><div class=main-content><h3 style=\"text-align: center\">{{ sharedState.workgroup.name }} Workgroup</h3><div class=\"panel minimal minimal-gray\"><div class=panel-heading><uib-tabset active=activeJustified justified=false class=\"panel-options pull-left nav-tabs\"><uib-tab index=0 heading=Tags><div class=tags-section ng-controller=TagCtrl><div class=col-md-6><ul class=tags-input><li ng-repeat=\"tagId in view.state.tags.ids\"><div class=row><div class=col-sm-5><input class=form-control name=text size=30 ng-model=view.state.tags.list[tagId].name auto-input on-enter=updateTag(view.state.tags.list[tagId]) help-text-placement=top></div><div class=col-sm-4><colorpicker type=text color=view.state.tags.list[tagId].color on-change=updateTag(view.state.tags.list[tagId])></div><div class=col-sm-3><a class=\"text-danger clickable btn btn-block\" confirm-button=removeTag(tagId) message=\"Are you sure you want to remove this tag\" yes=Remove no=Cancel placement=right aria-hidden=true><i class=entypo-cancel-squared></i><small>Remove</small></a></div></div></li><li><div class=row><div class=col-sm-5><input class=form-control name=text size=30 placeholder=\"Add New Tag\" ng-model=view.state.tags.newTag.name></div><div class=col-sm-4><colorpicker type=text color=view.state.tags.newTag.color></div><div class=col-sm-3><button type=button class=\"btn btn-blue btn-block\" ng-click=addTag()>Add</button></div></div></li></ul></div></div></uib-tab><uib-tab index=1 heading=Locations><div class=locations-section ng-controller=LocationCtrl><div class=row><div class=col-md-6><ul class=locations-input><li ng-repeat=\"locationId in view.state.locations.ids\"><input class=form-control name=text size=30 ng-model=view.state.locations.list[locationId].description auto-input on-enter=updateLocation(view.state.locations.list[locationId]) help-text-placement=top> <a class=\"text-danger clickable\" confirm-button=removeLocation(locationId) message=\"Are you sure you want to remove this location\" yes=Remove no=Cancel placement=right aria-hidden=true><i class=entypo-cancel-squared></i><small>Remove</small></a></li><li><div class=form-horizontal><input class=form-control name=text size=30 placeholder=\"Add New Location\" ng-model=view.state.locations.newLocation.description> <button type=button class=\"btn btn-blue\" ng-click=addLocation()>Add</button></div></li></ul></div></div></div></uib-tab><uib-tab index=2 heading=\"People &amp; Roles\"><div class=users-view ng-controller=UserCtrl><div class=row><div class=\"col-md-4 pull-right\"><div class=\"input-group search-input\"><input ng-model=view.searchQuery placeholder=\"Search by name or login ID\" uib-typeahead=\"person.name for person in searchUsers($viewValue)\" ng-change=\"view.state.users.newUser = {}\" typeahead-loading=view.loadingPeople typeahead-no-results=view.noResults typeahead-wait-ms=400 typeahead-min-length=2 typeahead-on-select=\"searchUsersResultSelected($item, $model, $label, $event)\" class=form-control> <i ng-hide=\"view.noResults || view.loadingPeople\" class=entypo-search></i> <i ng-show=view.loadingPeople class=entypo-cw></i> <i ng-show=view.noResults class=entypo-cancel ng-click=clearUserSearch()></i> <span class=input-group-btn><button ng-disabled=!view.state.users.newUser.name class=\"pull-left btn btn-primary\" ng-click=addUserToWorkgroup()>Add Person</button></span></div></div></div><div class=row><div class=col-md-12><div class=role-section><table class=\"table table-hover\"><colgroup><col span=1 style=\"width: 20%\"><col span=1 style=\"width: 20%\"><col ng-repeat=\"roleId in view.state.roles.ids track by $index\" span=1 ng-style=\"{ 'width' : 55 / (view.state.roles.ids.length) + '%' }\"><col span=1 style=\"width: 5%\"></colgroup><thead><tr><th class=table-name-padding>Name</th><th class=table-email-padding>Email</th><th class=role-title ng-repeat=\"roleId in view.state.roles.ids track by $index\">{{ view.state.roles.list[roleId].getDisplayName() }}</th><th></th></tr></thead><tbody><tr class=user-list-item ng-repeat=\"userId in view.state.users.ids track by $index\"><td>{{ view.state.users.list[userId].name }}</td><td>{{ view.state.users.list[userId].email }}</td><td class=role-selector ng-repeat=\"roleId in view.state.roles.ids track by $index\"><input type=checkbox ng-checked=\"userHasRole(userId, view.state.roles.list[roleId])\" ng-click=\"toggleUserRole(userId, roleId)\"></td><td class=hover-ui><span confirm-button=removeUserFromWorkgroup(userId) message=\"Are you sure you want to remove this person\" yes=Remove no=Cancel placement=left class=\"entypo-minus-circled text-danger\" aria-hidden=true style=\"width: 10%\" uib-tooltip=Remove tooltip-placement=top></span></td></tr></tbody></table></div></div></div></div></uib-tab></uib-tabset></div></div></div>"
  );


  $templateCache.put('workgroup.html',
    "<!DOCTYPE html><html lang=en><head><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"Neon Admin Panel\"><meta name=author content=\"\"><link rel=icon href=/images/favicon.ico><title>IPA Workgroups</title><link rel=stylesheet href=/css/entypo.css><link rel=stylesheet href=/css/lib.css><link rel=stylesheet href=/css/neon-core.css><link rel=stylesheet href=/css/neon-theme.css><link rel=stylesheet href=/css/neon-forms.css><link rel=stylesheet href=/css/shared.css><link rel=stylesheet href=/css/workgroup.css><!--[if lt IE 9]><script src=\"assets/js/ie8-responsive-file-warning.js\"></script><![endif]--><!--[if lt IE 9]>\n" +
    "		<script src=\"https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js\"></script>\n" +
    "		<script src=\"https://oss.maxcdn.com/respond/1.4.2/respond.min.js\"></script>\n" +
    "	<![endif]--></head><body class=page-body ng-app=workgroupApp class=ng-cloak ng-cloak><base href=/workgroups/ ><div class=\"page-container sidebar-collapsed\" ng-view></div><div id=toast-container class=toast-top-right ng-if=\"$root.toast.message.length > 0\"><div class=\"toast toast-error\" style=\"display: block\"><div class=toast-message ng-bind=$root.toast.message></div></div></div><script src=/js/lib.js></script><script src=/js/sharedApp.js></script><script src=/js/sharedConfig.js></script><script src=/js/workgroupApp.js></script></body></html>"
  );

}]);
