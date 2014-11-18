/*globals angular*/
'use strict';


angular.module( 'gme.directives.projectService', [
  'gme.templates',
  'gme.services'
] )
.run( function () {

} )
.controller( 'ProjectServiceController', function ( $scope, $log, dataStoreService, projectService ) {
  $scope.projects = [];
  dataStoreService.connectToDatabase( 'multi', {host: window.location.basename} )
  .then( function () {
    //console.log('Connected ...');
    //return projectService.selectProject('my-db-connection-id', 'ADMEditor');
    projectService.getProjects( 'multi' )
    .then( function ( result ) {
      $scope.projects = Object.keys( result );
      for ( var i = $scope.projects.length - 1; i >= 0; i-- ) {
        result[$scope.projects[i]].info.id = $scope.projects[i];
        $scope.projects[i] = result[$scope.projects[i]].info;
      }
      console.log( $scope.projects );
    } );
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
