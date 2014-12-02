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
      $scope.tags = [];
      projectServiceTest.startTest().then(function(){
        projectService.getProjects('multi').then(function(results){
          $scope.projects = results;
        });

        projectService.getAvailableProjectTags('multi').then(function(results){
          $scope.tags = results;
        });


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
