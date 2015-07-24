/*globals angular, GME*/

module.exports = function ( $q, dataStoreService ) {
    'use strict';
    var logger = GME.classes.Logger.create('ng-gme:ProjectService', GME.gmeConfig.client.log);

    this.getProjectsAndBranches = function ( databaseId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            deferred = new $q.defer();

        dbConn.projectService = dbConn.projectService || {};

        dbConn.client.getProjects({rights: true, branches: true, asObject: true, info: true}, function ( err, result ) {
            var projectTags,
                branches,
                projects = [],
                projectMapper,
                projectTagsMapper,
                branchMapper;

            projectTagsMapper = function ( tagName, tagId ) {
                projectTags.push( {
                    id: tagId,
                    name: tagName
                } );
            };

            branchMapper = function ( commitId, branchId ) {
                branches.push( {
                    branchId: branchId,
                    commitId: commitId
                } );
            };

            projectMapper = function ( project, projectId ) {
                projectTags = [];
                branches = [];

                project.info = project.info || {};

                // Transform tags
                angular.forEach( project.info.tags, projectTagsMapper );
                project.info.tags = projectTags;

                // Transform branches
                angular.forEach( project.branches, branchMapper );

                // Transform project
                projects.push( {
                    id: projectId,
                    branches: branches,
                    info: project.info,
                    rights: project.rights
                } );
            };

            if ( err ) {
                deferred.reject( err );
                return;
            }

            angular.forEach( result, projectMapper );
            deferred.resolve( projects );
        } );
        return deferred.promise;
    };

    this.getProjects = function ( databaseId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            deferred = new $q.defer();

        dbConn.projectService = dbConn.projectService || {};

        dbConn.client.getProjects( {}, function ( err, projectIds ) {
            if ( err ) {
                deferred.reject( err );
                return;
            }

            deferred.resolve( projectIds );
        } );

        return deferred.promise;
    };

    //TODO: This should be seedProject
    //this.createProject = function ( databaseId, projectname, seedParameters ) {
    //    var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
    //        deferred = new $q.defer();
    //
    //    dbConn.client.createProjectAsync( projectname, projectInfo, function ( err ) {
    //        if ( err ) {
    //            deferred.reject( err );
    //            return;
    //        } else {
    //            deferred.resolve();
    //        }
    //    } );
    //
    //    return deferred.promise;
    //};

    this.deleteProject = function ( databaseId, projectId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            deferred = new $q.defer();

        logger.debug( 'deleteProject', projectId );

        dbConn.client.deleteProject( projectId, function ( err ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                deferred.resolve();
            }
        } );

        return deferred.promise;
    };

    this.selectProject = function ( databaseId, projectId, branchName ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            deferred = new $q.defer();

        dbConn.projectService = dbConn.projectService || {};

        // Make sure that PROJECT_OPENED is registered.
        // self.on( databaseId, 'RegisterEventListener', function () {} );
        dbConn.client.selectProject( projectId, branchName, function ( err ) {
            if ( err ) {
                deferred.reject( err );
                return;
            }

            dbConn.projectService.projectId = projectId;
            dbConn.projectService.isInitialized = true;

            dbConn.branchService = dbConn.branchService || {};
            dbConn.branchService.branchId = branchName || 'master';
            dbConn.branchService.isInitialized = true;

            deferred.resolve( projectId );
        } );

        return deferred.promise;
    };

    /**
     * Registers fn to listen to events regarding deletion and creation of projects;
     * CONSTANTS.STORAGE.PROJECT_CREATED = 'PROJECT_CREATED'
     * CONSTANTS.STORAGE.PROJECT_DELETED = 'PROJECT_DELETED'
     *
     * The fn is called with emitter as first argument and data as second.
     *
     * Example:
     * data = {
     *    etype: 'PROJECT_CREATED',
     *    projectName: 'TestProject'
     * }
     *
     * @param databaseId
     * @param fn
     * @returns {*}
     */
    this.watchProjects = function ( databaseId, fn ) {
        var deferred = new $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( databaseId );

        dbConn.client.watchDatabase( fn, function ( err ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    /**
     * Stop watching events regarding project creation and deletion.
     *
     * @param databaseId
     * @param fn - same function that was passed in watchProjects..
     * @returns {*}
     */
    this.unwatchProjects = function ( databaseId, fn ) {
        var deferred = new $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( databaseId );

        dbConn.client.unwatchDatabase( fn, function ( err ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
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

            dbConn.client.addEventListener( dbConn.client.CONSTANTS.PROJECT_OPENED,
                function ( dummy /* FIXME */ , projectId ) {

                    if ( dbConn.projectService.projectId !== projectId ) {
                        dbConn.projectService.projectId = projectId;

                        logger.debug( 'There was a PROJECT_OPENED event', projectId );
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

            dbConn.client.addEventListener( dbConn.client.CONSTANTS.PROJECT_CLOSED,
                function ( /*dummy*/ /* FIXME */) {
                    logger.debug( 'There was a PROJECT_CLOSED event', dbConn.projectService.projectId );

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