/*globals GME*/

'use strict';

module.exports = function ( $q, $http ) {
    var dataStores = {},
        connectQueue = [],
        queueProcessing = false,
        connectNextInQueue,
        processQueue;


    // Picks up the next connectionmeta and tries to connect
    // After a(n) (un)successful connection, the defered resolve/promise is called
    // and the function picks up the next item from the queue
    connectNextInQueue = function () {
        if ( connectQueue.length > 0 ) {
            var currentItem = connectQueue[ 0 ];

            if ( dataStores.hasOwnProperty( currentItem.databaseId ) ) {
                // FIXME: this may or may not ready yet...
                currentItem.deferred.resolve();
                connectQueue.splice( 0, 1 );
                connectNextInQueue();
            } else {
                $http.get( currentItem.options.host + '/gmeConfig.json' )
                    .success( function ( gmeConfig ) {
                        var client = new GME.classes.Client( gmeConfig );

                        // hold a reference to the client instance
                        dataStores[ currentItem.databaseId ] = {
                            client: client,
                            gmeConfig: gmeConfig,
                            isInTransaction: false
                        };

                        // TODO: add event listeners to client
                        // FIXME: deferred should not be used from closure
                        client.connectToDatabaseAsync( {}, function ( err ) {
                            if ( err ) {
                                currentItem.deferred.reject( err );
                            } else {
                                currentItem.deferred.resolve();
                            }

                            connectQueue.splice( 0, 1 );
                            connectNextInQueue();
                        } );
                    } ).error( function ( err ) {
                        currentItem.deferred.reject( err );
                    } );
            }
        } else {
            queueProcessing = false;
            if ( connectQueue.length > 0 ) {
                processQueue();
            }
        }
    };

    // Check if there are any processing phase
    // No simultaneous processing
    processQueue = function () {
        if ( !queueProcessing ) {
            queueProcessing = true;
            connectNextInQueue();
        }
    };

    // Just one connection phase at one time.
    // Multiple connection phase may cause 'unexpected results'
    this.connectToDatabase = function ( databaseId, options ) {
        var deferred = $q.defer();

        // Put the connection metadata into a queue
        connectQueue.push( {
            databaseId: databaseId, // Where to connect? Default: 'multi'
            deferred: deferred, // defered object, where the notifications are sent if the connection succesful (or not)
            options: options // Connection oprtions
        } );

        processQueue();

        return deferred.promise;
    };

    this.getDatabaseConnection = function ( databaseId ) {
        if ( dataStores.hasOwnProperty( databaseId ) && typeof dataStores[ databaseId ] === 'object' ) {
            return dataStores[ databaseId ];
        }

        console.error( databaseId + ' does not have an active database connection.' );
    };

    /**
     * Registered functions are fired when the NETWORKSTATUS_CHANGED event was raised.
     * TODO: Currently the eventTypes are passed to fn as the values in networkStates.
     *  networkStates = {
     *    'CONNECTED':    'connected',
     *    'DISCONNECTED': 'socket.io is disconnected'
     *  };
     * @param {string} databaseId
     * @param {function} fn
     */
    this.watchConnectionState = function ( databaseId, fn ) {
        var dbConn = dataStores[ databaseId ];

        if ( !( dbConn && typeof dbConn === 'object' ) ) {
            console.error( databaseId + ' does not have an active database connection.' );
        }

        if ( typeof dbConn.events === 'undefined' || typeof dbConn.events.connectionState === 'undefined' ) {
            dbConn.events = dbConn.events || {};
            dbConn.events.connectionState = dbConn.events.connectionState || [];
            dbConn.events.connectionState.push( fn );
            dbConn.client.addEventListener( dbConn.client.events.NETWORKSTATUS_CHANGED,
                function ( dummy, eventType ) {
                    var i;
                    console.log( eventType );
                    for ( i = 0; i < dbConn.events.connectionState.length; i += 1 ) {
                        dbConn.events.connectionState[ i ]( eventType );
                    }
                } );
        } else {
            dbConn.events.push( fn );
        }
    };

    // TODO: on selected project changed, on initialize and on destroy (socket.io connected/disconnected)
};
