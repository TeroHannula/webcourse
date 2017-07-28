// create the module and name it

var assignment_module = angular.module('app', ['ngRoute']);

assignment_module.config(function($routeProvider) { // configure routes for navigation

		$routeProvider.when('/', {
				templateUrl : 'index.html'
			})
            
            .when('/projects', {
				templateUrl : 'projects.html'
            })
            
            .when('/contact', {
				templateUrl : 'contact.html'
			})

			.when('/links', {
				templateUrl : 'links.html'
			})
            
			.when('/skills', {
				templateUrl : 'skills.html'
			});
    })

assignment_module.controller("mainCtrl", ['$scope', function($scope) {
            
    $scope.a=0;
    
}]);

assignment_module.controller('TimeCtrl', ['$scope', '$interval', function($scope, $interval) {
  
	// run the clock in the footer
	var tick = function() {
    	$scope.clock = Date.now();
  	}
  	tick();
  	$interval(tick, 1000);

}]);