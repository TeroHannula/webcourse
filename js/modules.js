// create the module and name it

var assignment_module = angular.module('app', ['ngRoute']);

assignment_module.config(function($routeProvider) {
		$routeProvider.when('/', {
				templateUrl : 'index.html',
				controller  : 'mainCtrl'
			})
            
            .when('/projects', {
				templateUrl : 'projects.html',
				controller  : 'mainCtrl'
            })
            
            .when('/contact', {
				templateUrl : 'contact.html',
				controller  : 'mainCtrl'
			})
            
			.when('/skills', {
				templateUrl : 'skills.html',
				controller  : 'mainCtrl'
			});
    });
        
    assignment_module.controller("mainCtrl", ['$scope', function($scope) {


   }]);