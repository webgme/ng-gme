/*globals angular*/

'use strict';

module.exports = function ( $q, dataStoreService ) {

  this.getAvailableProjectTags = function (databaseId){
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
    deferred = $q.defer();
    dbConn.projectService = dbConn.projectService || {};
    dbConn.client.getAllInfoTagsAsync( function ( err, results ) {
      var tagKeys,
          tags = [];
      if ( err ) {
        deferred.reject( err );
        return;
      }

      tagKeys = Object.keys(results);
      for (var i = tagKeys.length - 1; i >= 0; i--) {
        tags.push({id:tagKeys[i],name:results[tagKeys[i]]});
      }

      deferred.resolve( tags );
    } );

    return deferred.promise;
  };

  this.applyTagsOnProject = function (/*databaseId, projectId, tags*/){
    // NOTE: Waiting for core fucntion form Tamas
    // GetProjectInfo
    return null;
  };

  this.getAvailableProjects = function ( databaseId ) {
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
    deferred = $q.defer();
    dbConn.projectService = dbConn.projectService || {};
    dbConn.client.getAvailableProjectsAsync( function ( err, projects ) {
      if ( err ) {
        deferred.reject( err );
        return;
      }

      deferred.resolve( projects );
    } );

    return deferred.promise;
  };

  this.getProjects = function ( databaseId ) {

    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
      deferred = new $q.defer();

    dbConn.projectService = dbConn.projectService || {};

    dbConn.client.getFullProjectsInfoAsync( function ( err, result ) {

      var i,
        projectTags,
        projects,
        projectTagsMapper;

      projectTagsMapper = function(tagName, tagId) {
          projectTags.push({
            id: tagId,
            name: tagName
          });
        };

      if ( err ) {
        deferred.reject( err );
        return;
      }

      if (result === null){
        result = [];
      }

      projects = Object.keys(result);

      for (i = projects.length - 1; i >= 0; i--) {
        result[projects[i]].info.id = projects[i];
        projects[i] = result[projects[i]].info;

        projectTags = [];

        angular.forEach(projects[i].tags, projectTagsMapper );

        projects[i].tags = projectTags;

      }

      deferred.resolve( projects );
    } );

    return deferred.promise;

  };

  this.getProjectsIds = function ( databaseId ) {
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
      deferred = new $q.defer();

    dbConn.projectService = dbConn.projectService || {};

    dbConn.client.getAvailableProjectsAsync( function ( err, projectIds ) {
      if ( err ) {
        deferred.reject( err );
        return;
      }

      deferred.resolve( projectIds );
    } );

    return deferred.promise;
  };

  this.createProject = function ( databaseId, projectname, projectInfo ) {
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
      deferred = new $q.defer();

    dbConn.client.createProjectAsync( projectname, projectInfo, function ( err ) {
      if ( err ) {
        deferred.reject( err );
        return;
      } else {
        deferred.resolve();
      }
    } );

    return deferred.promise;
  };

  this.deleteProject = function ( databaseId, projectname ) {
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
      deferred = new $q.defer();

    dbConn.client.deleteProjectAsync( projectname, function ( err ) {
      if ( err ) {
        deferred.reject( err );
        return;
      } else {
        deferred.resolve();
      }
    } );

    return deferred.promise;
  };

  this.selectProject = function ( databaseId, projectId ) {
    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
      deferred = new $q.defer();

    dbConn.projectService = dbConn.projectService || {};

    this.getProjectsIds( databaseId )
      .then( function ( projectIds ) {
        if ( projectIds.indexOf( projectId ) > -1 ) {
          dbConn.client.selectProjectAsync( projectId, function ( err ) {
            if ( err ) {
              deferred.reject( err );
              return;
            }

            dbConn.projectService.projectId = projectId;

            deferred.resolve( projectId );
          } );
        } else {
          deferred.reject( new Error( 'Project does not exist. ' + projectId + ' databaseId: ' +
            databaseId ) );
        }
      } )
      .
    catch ( function ( reason ) {
      deferred.reject( reason );
    } );

    return deferred.promise;
  };

  this.watchProjects = function ( /*databaseId*/) {
    // TODO: register for project events
    // TODO: SERVER_PROJECT_CREATED
    // TODO: SERVER_PROJECT_DELETED

    throw new Error( 'Not implemented yet.' );
  };

  this.on = function ( databaseId, eventName, fn ) {
    var dbConn,
      i;

    console.assert( typeof databaseId === 'string' );
    console.assert( typeof eventName === 'string' );
    console.assert( typeof fn === 'function' );

    dbConn = dataStoreService.getDatabaseConnection( databaseId );
    dbConn.projectService = dbConn.projectService || {};

    dbConn.projectService.isInitialized = dbConn.projectService.isInitialized || false;

    if ( typeof dbConn.projectService.events === 'undefined' ) {
      // this should not be an inline function

      dbConn.client.addEventListener( dbConn.client.events.PROJECT_OPENED,
        function ( dummy /* FIXME */ , projectId ) {

          if ( dbConn.projectService.projectId !== projectId ) {
            dbConn.projectService.projectId = projectId;

            console.log( 'There was a PROJECT_OPENED event', projectId );
            if ( projectId ) {
              // initialize
              if ( dbConn.projectService &&
                dbConn.projectService.events &&
                dbConn.projectService.events.initialize ) {

                dbConn.projectService.isInitialized = true;

                for ( i = 0; i < dbConn.projectService.events.initialize.length; i += 1 ) {
                  dbConn.projectService.events.initialize[ i ]( databaseId );
                }
              }
            } else {
              // branchId is falsy, empty or null or undefined
              // destroy
              if ( dbConn.projectService &&
                dbConn.projectService.events &&
                dbConn.projectService.events.destroy ) {

                dbConn.projectService.isInitialized = false;

                for ( i = 0; i < dbConn.projectService.events.destroy.length; i += 1 ) {
                  dbConn.projectService.events.destroy[ i ]( databaseId );
                }
              }
            }
          }
        } );

      dbConn.client.addEventListener( dbConn.client.events.PROJECT_CLOSED,
        function ( /*dummy*/ /* FIXME */) {
          console.log( 'There was a PROJECT_CLOSED event', dbConn.projectService.projectId );

          delete dbConn.projectService.projectId;

          // destroy
          if ( dbConn.projectService &&
            dbConn.projectService.events &&
            dbConn.projectService.events.destroy ) {

            dbConn.projectService.isInitialized = false;

            for ( i = 0; i < dbConn.projectService.events.destroy.length; i += 1 ) {
              dbConn.projectService.events.destroy[ i ]( databaseId );
            }
          }

        } );
    }

    dbConn.projectService.events = dbConn.projectService.events || {};
    dbConn.projectService.events[ eventName ] = dbConn.projectService.events[ eventName ] || [];
    dbConn.projectService.events[ eventName ].push( fn );

    if ( dbConn.projectService.isInitialized ) {
      if ( eventName === 'initialize' ) {
        fn( databaseId );
      }
    } else {
      if ( eventName === 'destroy' ) {
        fn( databaseId );
      }
    }
  };
};
