/*globals angular*/
'use strict';


angular.module('gme.directives.projectService', [
        'gme.templates',
        'gme.services',
        'gme.testServices'
    ])
    .run(function() {

    })
    .controller('ProjectServiceController', function($scope, $log, $q, dataStoreService, projectService, projectServiceTest) {
      $scope.projects = [];
      projectServiceTest.startTest().then(function(result){
        $scope.projects = result;
      });
    })
    .directive('projectService', function() {
        return {
            scope: false,
            restrict: 'E',
            controller: 'ProjectServiceController',
            replace: true,
            templateUrl: '/ng-gme/templates/projectService.html'
        };
    });
