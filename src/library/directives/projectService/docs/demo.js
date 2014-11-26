/*globals angular*/
'use strict';

var demoApp = angular.module( 'gme.projectService.demo', [ 'gme.directives.projectService' ] );

demoApp.controller( 'ProjectServiceDemoController', function ( $scope, $log ) {
  $log.debug( 'In ProjectServiceDemoController' );
} );