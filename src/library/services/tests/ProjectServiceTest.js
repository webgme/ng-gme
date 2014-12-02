'use strict';

require( '../gmeServices.js' );

module.exports = function ( $q, dataStoreService, projectService ) {
  var testProjects = [
    {
      projectName: 'ProjectServiceTest1',
      projectInfo: {
        visibleName: 'ProjectServiceTest1',
        description: 'project in webGME',
        tags: {
          tag1: 'Master'
        }
      }
    },
    {
      projectName: 'ProjectServiceTest2',
      projectInfo: {
        visibleName: 'ProjectServiceTest2',
        description: 'project in webGME',
        tags: {
          tag1: 'Master'
        }
      }
    }
  ];

  /*function getProjects() {
   var deferred = new $q.defer();
   projectService.getProjects('multi')
   .then(function(result) {
   var projects = Object.keys(result);
   for (var i = projects.length - 1; i >= 0; i--) {
   result[projects[i]].info.id = projects[i];
   projects[i] = result[projects[i]].info;
   }
   deferred.resolve(projects);
   });
   return deferred.promise;
   }*/

  this.startTest = function () {
    var deferred = new $q.defer(),
    index = 0;

    dataStoreService.connectToDatabase( 'multi', {
      host: window.location.basename
    } )
    .then( function () {
      projectService.getAvailableProjects( 'multi' ).then( function ( names ) {
        if ( names ) {
          var createProjectPromises = [];

          for ( index = 0; index < testProjects.length; index++ ) {
            // If testProject doesn't exist
            if ( names.indexOf( testProjects[index].projectName ) === -1 ) {
              createProjectPromises.push( projectService.createProject( 'multi', testProjects[index].projectName,
              testProjects[index].projectInfo ) );
            }
          }

          // Waiting for the createProject promise
          if ( createProjectPromises.length > 0 ) {
            $q.all( createProjectPromises ).then( function () {
              deferred.resolve();
              //projectService.getProjects('multi').then(function(results){deferred.resolve(results);});
            } );
          } else {
            deferred.resolve();
            //projectService.getProjects('multi').then(function(results){deferred.resolve(results);});
          }
        }
      } );
    } );

    return deferred.promise;
  };
};

/*
 angular.module('gme.tests.projectService', [
 'gme.services',
 'gme.tests.projectService'
 ])
 .factory('TestProjectsService', function($scope, $log, $q, dataStoreService, projectService) {
 var result = {
 startTest: null
 },
 testProjects = [{
 projectName: 'ProjectServiceTest1',
 projectInfo: {
 visibleName: 'ProjectServiceTest1',
 description: 'project in webGME',
 tags: {
 tag1: 'Master'
 }
 }
 }, {
 projectName: 'ProjectServiceTest2',
 projectInfo: {
 visibleName: 'ProjectServiceTest2',
 description: 'project in webGME',
 tags: {
 tag1: 'Master'
 }
 }
 }],
 index = 0;

 function getProjects() {
 var deferred = new $q.defer();
 projectService.getProjects('multi')
 .then(function(result) {
 var projects = Object.keys(result);
 for (var i = projects.length - 1; i >= 0; i--) {
 result[projects[i]].info.id = projects[i];
 projects[i] = result[projects[i]].info;
 }
 deferred.resolve(projects);
 });
 return deferred;
 }

 function startTest() {
 var deferred = new $q.defer();

 dataStoreService.connectToDatabase('multi', {
 host: window.location.basename
 })
 .then(function() {
 projectService.getAvailableProjects('multi').then(function(names) {
 if (names) {
 var createProjectPromises = [];

 for (index = 0; index < testProjects.length; index++) {
 // If testProject doesn't exist
 if (names.indexOf(testProjects[index].projectName) === -1) {
 createProjectPromises.push(projectService.createProject('multi', testProjects[index].projectName, testProjects[index].projectInfo));
 }
 }

 // Waiting for the createProject promise
 if (createProjectPromises.length > 0) {
 $q.all(createProjectPromises).then(function() {
 getProjects().then(function(results){deferred.resolve(results);});
 });
 } else {
 getProjects().then(function(results){deferred.resolve(results);});
 }
 }
 });
 });

 return deferred;
 }

 result.startTest = startTest;
 return result;

 });*/
