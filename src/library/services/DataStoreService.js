/*globals GME*/

'use strict';

module.exports = function ( $q ) {
    var dataStores = {},
        connectQueue = [],
        queueProcessing = false,
        connectNextInQueue,
        processQueue;


    // Picks up the next connection-meta and tries to connect
    // After a(n) (un)successful connection, the deferred resolve/promise is called
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
                var client = new GME.classes.Client( currentItem.options );

                // hold a reference to the client instance
                dataStores[ currentItem.databaseId ] = {
                    client: client,
                    isInTransaction: false
                };

                // TODO: add event listeners to client
                // FIXME: deferred should not be used from closure
                client.connectToDatabase(function ( err ) {
                    if ( err ) {
                        currentItem.deferred.reject( err );
                    } else {
                        currentItem.deferred.resolve();
                    }

                    connectQueue.splice( 0, 1 );
                    connectNextInQueue();
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
            databaseId: databaseId, // User configurable id of the data-base connection
            deferred: deferred, // deferred object, where the notifications are sent if the connection successful (or not)
            options: options // Connection options (GME.gmeConfig)
        } );

        processQueue();

        return deferred.promise;
    };

    this.disconnectFromDatabase = function ( databaseId ) {
        var deferred = $q.defer(),
            dbConn = this.getDatabaseConnection( databaseId );

        if ( dbConn ) {
            dbConn.client.disconnectfromDatabase(function ( err ) {
                if ( err ) {
                    deferred.reject( err );
                } else {
                    deferred.resolve();
                }
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    this.getDatabaseConnection = function ( databaseId ) {
        if ( dataStores.hasOwnProperty( databaseId ) && typeof dataStores[ databaseId ] === 'object' ) {
            return dataStores[ databaseId ];
        }

        console.error( databaseId + ' does not have an active database connection.' );
    };

    /**
     * Registered functions are fired when the NETWORK_STATUS_CHANGED event was raised.
     * TODO: Currently the eventTypes are passed to fn as the values in networkStates.
     *  networkStates -
     *  dbConn.client.CONSTANTS.STORAGE.CONNECTED = 'CONNECTED'
     *  dbConn.client.CONSTANTS.STORAGE.DISCONNECTED = 'DISCONNECTED'
     *  dbConn.client.CONSTANTS.STORAGE.RECONNECTED = 'RECONNECTED'
     *
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
            dbConn.client.addEventListener( dbConn.client.CONSTANTS.NETWORK_STATUS_CHANGED,
                function ( client, connectionState ) {
                    var i;
                    console.log( connectionState );
                    for ( i = 0; i < dbConn.events.connectionState.length; i += 1 ) {
                        dbConn.events.connectionState[ i ]( connectionState );
                    }
                } );
        } else {
            dbConn.events.push( fn );
        }
    };

    // TODO: on selected project changed, on initialize and on destroy (socket.io connected/disconnected)
};
