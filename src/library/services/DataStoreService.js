/*globals WebGMEGlobal*/

'use strict';

module.exports = function ( $q ) {
  var dataStores = {};

  this.connectToDatabase = function ( databaseId, options ) {
    var deferred = $q.defer(),
      client;

    if ( dataStores.hasOwnProperty( databaseId ) ) {
      // FIXME: this may or may not ready yet...
      deferred.resolve();
    } else {
      client = new WebGMEGlobal.classes.Client( options );

      // hold a reference to the client instance
      dataStores[ databaseId ] = {
        client: client
      };

      // TODO: add event listeners to client

      // FIXME: deferred should not be used from closure
      client.connectToDatabaseAsync( {}, function ( err ) {
        if ( err ) {
          deferred.reject( err );
          return;
        }

        deferred.resolve();
      } );
    }

    return deferred.promise;
  };

  this.getDatabaseConnection = function ( databaseId ) {
    if ( dataStores.hasOwnProperty( databaseId ) && typeof dataStores[ databaseId ] === 'object' ) {
      return dataStores[ databaseId ];
    }

    console.error( databaseId + ' does not have an active database connection.' );
  };

  this.watchConnection = function ( /*databaseId*/) {
    // TODO: handle events
    // TODO: CONNECTED
    // TODO: DISCONNECTED

    // TODO: NETWORKSTATUS_CHANGED

    throw new Error( 'Not implemented yet.' );
  };

  // TODO: on selected project changed, on initialize and on destroy (socket.io connected/disconnected)
};