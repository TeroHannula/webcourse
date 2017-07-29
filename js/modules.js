
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

	$scope.newskill = {
			description: "",
			imageurl: ""
		};

	$scope.skills = [
		{
			description: "After going through all kind of sinful jobs, I decided to go and be a priest for a change.",
			imageurl: "https://www.ncronline.org/sites/default/files/styles/article_slideshow/public/stories/images/thumbRNS-PRIEST-SUSPENDED090116.jpg?itok=wxRSG7-h"
		},
		{
			description: "I'm well educated and experienced multi-skilled car washer. I've been doing this since 1968.",
			imageurl: "http://cdn.xl.thumbs.canstockphoto.com/canstock20491718.jpg"
		},
		{
			description: "My first long term job was a shavel man in various international projects.",
			imageurl: "http://omg.wthax.org/Senior_man_holding_shovel_JUF08047.jpg"
		}
	];

	// This function adds only predefined skill descriptions to the array of skills

	$scope.addSkill = function() {

		var description=$scope.newskill.description;
		var imageurl=$scope.newskill.imageurl;
		console.log("" + description +", " + imageurl);
		$scope.skills.unshift({description: description, imageurl: imageurl});
		if($scope.skills.length > 5) {
			$scope.skills.pop();
		}
		$scope.newskill.description = "";
		$scope.newskill.imageurl = "";
	}

	$scope.isReadyToPublish = function() {
		if($scope.newskill.description.length > 0)
			return true;
		else
			return false;
	}

	// form sending functions

	$scope.formSent = false;

	$scope.genders = ["male", "female", "twisted"];
	$scope.formsex = $scope.genders[0];

	$scope.formhandler = function(event) {
		event.preventDefault();
		$scope.formSent = true;
		return false;	// don't actually submit
	}

	$scope.setFormSent = function(value) {
		$scope.formSent = value;
	}

	$scope.isFormSent = function() {
		return $scope.formSent;
	}

}]);

// Non-AngularJS functions for scroll and mouseover events in projects page

var scrolled = function() {
	document.getElementById("scrolled").style.color="rgb(130,130,130)";
	window.setTimeout(scrolledOff, 100);
}

var scrolledOff = function() {
	document.getElementById("scrolled").style.color="rgb(210,210,210)";
}

var firstprojectIn = function() {
	document.getElementById("first").style.color="rgb(130,130,130)";
}

var firstprojectOut = function() {
	document.getElementById("first").style.color="rgb(210,210,210)";
}
