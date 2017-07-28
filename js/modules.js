
/*-----------------------------------------------------

The AngularJS module for the course assignment

Author: Tero Hannula (terohan@gmail.com)

------------------------------------------------------*/


// create the module and name it

var assignment_module = angular.module('app', ['ngRoute']);

// configure routes for navigation

assignment_module.config(['$routeProvider', function($routeProvider) { 

		$routeProvider.when("/", {
				templateUrl : "home.html"
			})
            
            .when("/projects", {
				templateUrl : "projects.html"
            })
            
            .when("/contact", {
				templateUrl : "contact.html"
			})

			.when("/links", {
				templateUrl : "links.html"
			})

			.when("/gallery", {
				templateUrl : "gallery.html"
			})
            
			.when("/skills", {
				templateUrl : "skills.html"
			})

			.otherwise({
                    redirectTo: "/"
            });
    }]);



// The only controller in this app

assignment_module.controller("mainCtrl", ['$scope', '$interval', function($scope, $interval) {

	// run the clock in the footer	
	var tick = function() {
    	$scope.clock = Date.now();
  	}
  	tick();
	$interval(tick, 1000); 

	
	
	// Nav bar related functions

	$scope.selectedpage='home';

	$scope.setSelected = function(selected) {
		$scope.selectedpage = selected;
	}

	$scope.getSelected = function(suggestion) {
		if(suggestion == $scope.selectedpage) 
			return true;
		else 
			return false;
		
	}

	// Skill list functions

	$scope.skilllevels = [
		{level: 1, description: "Professional, over 3 years"}, 
		{level: 2, description: "Practical experience under 3 years"}, 
		{level: 3, description: "Learning the subject"}
	];

	$scope.newskill = {
			name: "",
			level: ""
		};

	$scope.skills = [
		{
			name: "Taito 1",
			level: $scope.skilllevels[0].description
		},
		{
			name: "Taito 2",
			level: $scope.skilllevels[1].description
		}
	];

	// This function adds only predefined skill descriptions to the array of skills

	$scope.addSkill = function() {

		var skillname=$scope.newskill.name;
		var skilllevel=$scope.newskill.level;
		console.log("lisää " + skillname + ", " + $scope.newskill.level);

		$scope.skills.unshift({name: skillname, level: skilllevel});
		if($scope.skills.length > 5) {
			$scope.skills.pop();
		}
	}



}]);
