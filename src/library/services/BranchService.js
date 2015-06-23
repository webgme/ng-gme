/*globals GME*/
'use strict';

module.exports = function ( $q, dataStoreService, projectService ) {
    var logger = GME.classes.Logger.create('ng-gme:BranchService', GME.gmeConfig.client.log);

    this.selectBranch = function ( databaseId, branchId, reOpen ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            deferred = new $q.defer();
        logger.debug('selectBranch called', databaseId, branchId);
        dbConn.branchService = dbConn.branchService || {};

        if (dbConn.client.getActiveBranchName() === branchId && !reOpen) {
            logger.debug('branch was already selected (and reOpen falsy) resolved directly', databaseId, branchId);
            deferred.resolve(branchId);
        } else {
            dbConn.client.selectBranch(branchId, null,
                function (err) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    dbConn.branchService.branchId = branchId;
                    dbConn.branchService.isInitialized = true;
                    logger.debug('selectBranch resolved', databaseId, branchId);
                    deferred.resolve(branchId);
                });
        }

        return deferred.promise;
    };

    this.getBranches = function ( databaseId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            projectId = dbConn.client.getActiveProjectName(),
            deferred = new $q.defer();

        dbConn.branchService = dbConn.branchService || {};

        dbConn.client.getBranches( projectId, function ( err, branches ) {
            if ( err ) {
                deferred.reject( err );
                return;
            }

            dbConn.branchService.isInitialized = true;

            deferred.resolve( branches );
        } );

        return deferred.promise;
    };

    this.createBranch = function ( databaseId, branchId, hash ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            projectId = dbConn.client.getActiveProjectName(),
            deferred = new $q.defer();

        dbConn.branchService = dbConn.branchService || {};

        dbConn.client.createBranch( projectId, branchId, hash,
            function ( err ) {
                if ( err ) {
                    deferred.reject( err );
                    return;
                }

                deferred.resolve( branchId );
            } );

        return deferred.promise;
    };

    this.getSelectedBranch = function ( /*databaseId*/) {
        throw new Error( 'Not implemented yet.' );
    };

    /**
     * Registers fn to listen to events regarding deletion and creation of projects;
     * CONSTANTS.STORAGE.BRANCH_CREATED = 'BRANCH_CREATED'
     * CONSTANTS.STORAGE.BRANCH_DELETED = 'BRANCH_DELETED'
     * CONSTANTS.STORAGE.BRANCH_HASH_UPDATED = 'BRANCH_HASH_UPDATED'
     *
     * The fn is called with emitter as first argument and data as second.
     *
     * Example:
     * data = {
     *    etype: 'BRANCH_CREATED',
     *    projectName: 'TestProject',
     *    branchName: 'b1',
     *    newHash: '#somehash',
     *    oldHash: ''
     * }
     *
     * @param databaseId
     * @param projectId
     * @param fn
     * @returns {*}
     */
    this.watchBranches = function ( databaseId, projectId, fn ) {
        var deferred = new $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( databaseId );

        dbConn.client.watchProject( projectId, fn, function ( err ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    this.unwatchBranches = function ( databaseId, projectId, fn ) {
        var deferred = new $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( databaseId );

        dbConn.client.unwatchProject( projectId, fn, function ( err ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    /**
     * Registered functions are fired when the BRANCH_STATUS_CHANGED event was raised.
     * TODO: Currently the eventTypes are passed to fn as the values in branchStates.
     * fn is called eventData.
     * eventData has key status and optionally a key details based on status.
     *  status:
     *    CONSTANTS.BRANCH_STATUS.SYNC: 'SYNC',                         // details = undefined
     *    CONSTANTS.BRANCH_STATUS.AHEAD_SYNC: 'AHEAD_SYNC',             // details = commitQueue [array<Objects>]
     *    CONSTANTS.BRANCH_STATUS.AHEAD_NOT_SYNC: 'AHEAD_NOT_SYNC',     // details = commitQueue [array<Objects>]
     *    CONSTANTS.BRANCH_STATUS.PULLING: 'PULLING'                    // details = updateQueue.length [int]
     *    null
     * @param {string} databaseId
     * @param {function} fn
     */
    this.watchBranchState = function ( databaseId, fn ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId );
        if ( !( dbConn && dbConn.branchService && dbConn.branchService.branchId ) ) {
            logger.error( databaseId + ' does not have an active database connection or branch-service.' );
        }
        if ( typeof dbConn.branchService.events === 'undefined' ||
            typeof dbConn.branchService.events.branchState === 'undefined' ) {
            dbConn.branchService.events = dbConn.branchService.events || {};
            dbConn.branchService.events.branchState = dbConn.branchService.events.branchState || [];
            dbConn.branchService.events.branchState.push( fn );
            dbConn.client.addEventListener( dbConn.client.CONSTANTS.BRANCH_STATUS_CHANGED,
                function ( dummy, eventData ) {
                    var i;
                    for ( i = 0; i < dbConn.branchService.events.branchState.length; i += 1 ) {
                        dbConn.branchService.events.branchState[ i ]( eventData );
                    }
                } );
        } else {
            dbConn.branchService.events.branchState.push( fn );
        }
        // FIXME: When should these be cleaned up? On demand? On destroy? Never?
    };

    this.on = function ( databaseId, eventName, fn ) {
        var dbConn,
            i;

        console.assert( typeof databaseId === 'string' );
        console.assert( typeof eventName === 'string' );
        console.assert( typeof fn === 'function' );

        dbConn = dataStoreService.getDatabaseConnection( databaseId );
        dbConn.branchService = dbConn.branchService || {};

        dbConn.branchService.isInitialized = dbConn.branchService.isInitialized || false;

        if ( typeof dbConn.branchService.events === 'undefined' ) {
            // register for project events
            projectService.on( databaseId, 'initialize', function ( dbId ) {
                var dbConnEvent = dataStoreService.getDatabaseConnection( dbId ),
                    i;

                if ( dbConnEvent.branchService &&
                    dbConnEvent.branchService.events &&
                    dbConnEvent.branchService.events.initialize ) {

                    dbConnEvent.branchService.isInitialized = true;

                    for ( i = 0; i < dbConnEvent.branchService.events.initialize.length; i += 1 ) {
                        dbConnEvent.branchService.events.initialize[ i ]( dbId );
                    }
                }
            } );

            projectService.on( databaseId, 'destroy', function ( dbId ) {
                var dbConnEvent = dataStoreService.getDatabaseConnection( dbId ),
                    i;

                if ( dbConnEvent.branchService &&
                    dbConnEvent.branchService.events &&
                    dbConnEvent.branchService.events.destroy ) {

                    dbConnEvent.branchService.isInitialized = false;

                    for ( i = 0; i < dbConnEvent.branchService.events.destroy.length; i += 1 ) {
                        dbConnEvent.branchService.events.destroy[ i ]( dbId );
                    }
                }
            } );

            dbConn.client.addEventListener( dbConn.client.CONSTANTS.BRANCH_CHANGED,
                function ( projectId /* FIXME */ , branchId ) {

                    if ( dbConn.branchService.branchId !== branchId ) {

                        dbConn.branchService.branchId = branchId;

                        logger.debug( 'There was a BRANCH_CHANGED event', branchId );
                        if ( branchId ) {
                            // initialize
                            if ( dbConn.branchService &&
                                dbConn.branchService.events &&
                                dbConn.branchService.events.initialize ) {

                                dbConn.branchService.isInitialized = true;

                                for ( i = 0; i < dbConn.branchService.events.initialize.length; i += 1 ) {
                                    dbConn.branchService.events.initialize[ i ]( databaseId );
                                }
                            }
                        } else {
                            // branchId is falsy, empty or null or undefined
                            // destroy
                            if ( dbConn.branchService &&
                                dbConn.branchService.events &&
                                dbConn.branchService.events.destroy ) {

                                dbConn.branchService.isInitialized = false;
                                delete dbConn.branchService.branchId;

                                for ( i = 0; i < dbConn.branchService.events.destroy.length; i += 1 ) {
                                    dbConn.branchService.events.destroy[ i ]( databaseId );
                                }
                            }
                        }
                    }
                } );
        }

        dbConn.branchService.events = dbConn.branchService.events || {};
        dbConn.branchService.events[ eventName ] = dbConn.branchService.events[ eventName ] || [];
        dbConn.branchService.events[ eventName ].push( fn );

        if ( dbConn.branchService.isInitialized ) {
            if ( eventName === 'initialize' ) {
                fn( databaseId );
            }
        } else {
            if ( eventName === 'destroy' ) {
                fn( databaseId );
            }
        }

        // TODO: register for branch change event OR BranchService onInitialize
    };
};