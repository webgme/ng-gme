/*globals angular*/
'use strict';


angular.module( 'gme.directives.projectService', [
  'gme.templates',
  'gme.services'
] )
.run( function () {

} )
.controller( 'ProjectServiceController', function ( $scope, $log, $q, dataStoreService, projectService ) {
  var testProjects = [
    {
      projectName:'ProjectServiceTest1',
      projectInfo: {
        visibleName: 'ProjectServiceTest1',
        description: 'project in webGME',
        tags:{
          tag1:'Master'
        }
      }
    },
    {
      projectName:'ProjectServiceTest2',
      projectInfo: {
        visibleName: 'ProjectServiceTest2',
        description: 'project in webGME',
        tags:{
          tag1:'Master'
        }
      }
    }],
    index = 0;

  $scope.projects = [];
  dataStoreService.connectToDatabase( 'multi', {host: window.location.basename} )
  .then( function () {
    var getProjects = function() {
          projectService.getProjects( 'multi' )
            .then( function ( result ) {
              $scope.projects = Object.keys( result );
              for ( var i = $scope.projects.length - 1; i >= 0; i-- ) {
                result[$scope.projects[i]].info.id = $scope.projects[i];
                $scope.projects[i] = result[$scope.projects[i]].info;
              }
          });
        };

    projectService.getAvailableProjects( 'multi').then( function (names) {
      if (names) {
        var createProjectPromises = [];

        for(index = 0; index<testProjects.length; index++){
          // If testProject doesn't exist
          if (names.indexOf(testProjects[index].projectName)===-1){
            createProjectPromises.push(projectService.createProject('multi', testProjects[index].projectName, testProjects[index].projectInfo ));
          }
        }

        if (createProjectPromises.length>0){
          $q.all(createProjectPromises).then(getProjects);
        }
        else{
          getProjects();
        }
      }
    });

    return null;
  } );
} )
.directive( 'projectService', function () {
  return {
    scope: false,
    restrict: 'E',
    controller: 'ProjectServiceController',
    replace: true,
    templateUrl: '/ng-gme/templates/projectService.html'
  };
} );
