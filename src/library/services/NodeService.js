/*globals GME*/
'use strict';

module.exports = function ( $q, dataStoreService, branchService ) {

    var self = this,
        NodeObj,
        logger = GME.classes.Logger.create('ng-gme:NodeService', GME.gmeConfig.client.log),
        getIdFromNodeOrString;

    /**
     * Loads the meta nodes from the context (will create a node-service on the dbConn with regions if not present when invoked).
     * The meta-nodes will be returned in the following format:
     * {
     *     byId: {
     *         '1/2': NodeObj1,
     *         '1/3': NodeObj2,
     *         ...
     *         'x/x/': NodeObjN
     *     },
     *     byName: {
     *         'Name1': NodeObj1,
     *         'Name2': NodeObj2,
     *         ...
     *         'NameN': NodeObjN
     *     }
     * }
     * @param {object} context - From where to load the nodes.
     * @param {string} context.db - Database where the nodes will be loaded from.
     * @param {string} context.regionId - Region where the NodeObjs will be stored.
     * @returns {Promise<object>} - Returns an object of NodeObjs grouped by "byId" and "byName" when resolved.
     */
    this.getMetaNodes = function ( context ) {
        var deferred = $q.defer();
        self.loadNode( context, '' )
            .then( function ( rootNode ) {
                var metaNodeIds = rootNode.getMemberIds( 'MetaAspectSet' ),
                    queueList = [],
                    i;

                logger.debug('metaNodeIds', metaNodeIds);
                for ( i = 0; i < metaNodeIds.length; i += 1 ) {
                    queueList.push( self.loadNode( context, metaNodeIds[ i ] ) );
                }
                $q.all( queueList )
                    .then( function ( metaNodes ) {
                        var i,
                            metaNode,
                            meta = {
                                byId: {},
                                byName: {}
                            };
                        for ( i = 0; i < metaNodes.length; i += 1 ) {
                            metaNode = metaNodes[ i ];
                            meta.byId[ metaNode.getId() ] = metaNode;
                            meta.byName[ metaNode.getAttribute( 'name' ) ] = metaNode;
                        }
                        deferred.resolve( meta );
                    } );
            } );

        return deferred.promise;
    };

    /**
     * Loads a node from context (will create a node-service on the dbConn with regions if not present when invoked).
     * @param {object} context - From where to look for the node.
     * @param {string} context.db - Database where the node will be looked for.
     * @param {string} context.regionId - Region where the NodeObj will be stored.
     * @param {string} id - Path to the node.
     * @returns {Promise<NodeObj>} - Returns the NodeObj when resolved.
     */
    this.loadNode = function ( context, id ) {
        var deferred = $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( context.db ),
            territoryId,
            territoryPattern = {},
            nodes;

        console.assert( typeof context.regionId === 'string' );

        territoryId = context.regionId + '_' + id;
        dbConn.nodeService = dbConn.nodeService || {};
        dbConn.nodeService.regions = dbConn.nodeService.regions || {};
        dbConn.nodeService.regions[ context.regionId ] = dbConn.nodeService.regions[ context.regionId ] || {
            regionId: context.regionId,
            nodes: {}
        };

        nodes = dbConn.nodeService.regions[ context.regionId ].nodes;
        if ( nodes.hasOwnProperty( id ) ) {
            logger.debug( 'Node already loaded..', id );
            deferred.resolve( nodes[ id ] );
        } else {
            dbConn.client.addUI( {}, function ( events ) {
                var i,
                    event;

                for ( i = 0; i < events.length; i += 1 ) {
                    event = events[ i ];
                    if ( id !== event.eid ) {
                        continue;
                    }
                    if ( event.etype === 'load' ) {
                        nodes[ id ] = new NodeObj( context, id );
                        nodes[ id ].territories.push( territoryId );
                        logger.debug( 'load event for', id );
                        deferred.resolve( nodes[ id ] );
                    } else if ( event.etype === 'update' ) {
                        logger.debug( 'update event for', id );
                        nodes[ id ]._onUpdate( event.eid );
                    } else if ( event.etype === 'unload' ) {
                        logger.debug( 'unload event for', id );
                        nodes[ id ]._onUnload( event.eid );
                        nodes[ id ].__onUnload();
                    } else {
                        throw 'Unexpected event type' + events[ i ].etype;
                    }
                }
            }, territoryId );

            territoryPattern[ id ] = {
                children: 0
            };
            dbConn.client.updateTerritory( territoryId, territoryPattern );
        }

        return deferred.promise;
    };

    /**
     * Creates a new node in the database and returns with the NodeObj.
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {string} context.regionId - Region where the NodeObj will be stored.
     * @param {NodeObj|string} parent - model where the node should be created.
     * @param {NodeObj|string} base - base, e.g. meta-type, of the new node.
     * @param {string} [msg] - optional commit message.
     * @returns {Promise<NodeObj>} - Evaluates to the newly created node (inside context).
     */
    this.createNode = function ( context, parent, base, msg ) {
        var deferred = $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( context.db ),
            parentId = getIdFromNodeOrString( parent ),
            baseId = getIdFromNodeOrString( base ),
            id;

        id = dbConn.client.createChild( {
            parentId: parentId,
            baseId: baseId
        }, msg );

        self.loadNode( context, id )
            .then( function ( node ) {
                deferred.resolve( node );
            } );

        return deferred.promise;
    };

    /**
     * Creates a new node in the database and returns with its assigned id (path).
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {object} parameters - as in client.createChild (see this.createNode for example).
     * @param {string} [msg] - optional commit message.
     * @returns {string} - id (path) of new node.
     */
    this.createChild = function ( context, parameters, msg ) {
        var dbConn = dataStoreService.getDatabaseConnection( context.db );
        return dbConn.client.createChild( parameters, msg );
    };

    /**
     * Updates the attribute of the given node
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {string} id - Path to node to update.
     * @param {string} name - Name of Attribute.
     * @param {string} value - New value for Attribute.
     * @param {string} [msg] - optional commit message.
     * @returns {string} - id (path) of new node.
     */
    this.setAttributes = function ( context, id, name, value, msg ) {
        var dbConn = dataStoreService.getDatabaseConnection( context.db );
        return dbConn.client.setAttributes( id, name, value, msg );
    };

    /**
     * Removes the node from the data-base connection.
     * @param {object} context - From where to delete the node.
     * @param {string} context.db - Database from where the node will be deleted.
     * @param {NodeObj|string} nodeOrId - node that should be deleted (the NodeObj(s) will be removed from all regions through __OnUnload()).
     * @param {string} [msg] - optional commit message.
     */
    this.destroyNode = function ( context, nodeOrId, msg ) {
        var dbConn = dataStoreService.getDatabaseConnection( context.db ),
            id = getIdFromNodeOrString( nodeOrId ),
            nodeToDelete = dbConn.client.getNode( id );
        if ( nodeToDelete ) {
            dbConn.client.delMoreNodes( [ id ], msg );
        } else {
            logger.warn( 'Requested deletion of node that does not exist in context! (id, context) ',
                id,
                context );
        }
    };

    /**
     * Copies the nodes from nodeIds into parentId. N.B. all participating nodes need to be loaded in some region.
     * nodesToCopy:
     *  {
     *      '/1/2/3': {
     *          registry: {
     *              position: {
     *                  x: 100,
     *                  y: 100
     *              }
     *          },
     *          attributes: {
     *              name: 'Copy'
     *          }
     *      },
     *      '/1/2/4': {
     *          attributes: {
     *              name: 'Copy'
     *          }
     *      },
     *      '/1/2/5': null
     *  }
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {string} parentId - Path to parent node (must be loaded and needs to watch for new children to get events).
     * @param {Object} nodesToCopy - Object where keys are ids of nodes to be copied, these need to be loaded in the client.
     */
    this.copyMoreNodes = function ( context, parentId, nodesToCopy ) {
        var dbConn = dataStoreService.getDatabaseConnection( context.db );
        nodesToCopy.parentId = parentId;

        // There is no callback/promise here, instead wait for events in the parent
        // granted it watches for new children.
        dbConn.client.copyMoreNodes( nodesToCopy );
    };

    /**
     * Removes all references and listeners attached to any NodeObj in the region.
     * N.B. This function must be invoked for all regions that a "user" created.
     * This is typically done in the "$scope.on($destroy)"-function of a controller.
     * @param {string} databaseId - data-base connection from where the region will be removed.
     * @param {string} regionId - Region to clean-up.
     */
    this.cleanUpRegion = function ( databaseId, regionId ) {
        var key,
            dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            region = dbConn.nodeService.regions[ regionId],
            nodes;
        // Go through all nodes and remove the territories associated with each node.

        if (region) {

            nodes = region.nodes;

            for (key in nodes) {
                if (nodes.hasOwnProperty(key)) {
                    nodes[key].cleanUpNode();
                }
            }

        }

        // Remove the reference to the region (includes) nodes.
        delete dbConn.nodeService.regions[ regionId ];
    };


    this.cleanUpAllRegions = function ( databaseId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId ),
            regionId;

        if ( dbConn.nodeService ) {
            //                console.log(dbConn.nodeService.regions);
            for ( regionId in dbConn.nodeService.regions ) {
                if ( dbConn.nodeService.regions.hasOwnProperty( regionId ) ) {
                    self.cleanUpRegion( databaseId, regionId );
                }
            }
            //                console.log(dbConn.nodeService.regions);
        }
    };

    /**
     * Starts a new transaction meaning where changes are bundled into a single commit upon
     * completion (see this.completeTransaction).
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {string} [msg] - Optional commit message.
     * @returns {boolean} - True if no other transaction was open.
     */
    this.startTransaction = function ( context, msg ) {
        var result = false,
            dbConn = dataStoreService.getDatabaseConnection( context.db );

        if ( dbConn.isInTransaction ) {
            // TODO: Remove error logging here and let user log.
            logger.error( 'Already in transaction - refused to start additional.' );
        } else {
            dbConn.isInTransaction = true;
            dbConn.client.startTransaction( msg );
            result = true;
        }

        return result;
    };

    /**
     * Closes an open transaction and updates the branch hash.
     * @param {object} context - Where to create the node.
     * @param {string} context.db - Database where the node will be created.
     * @param {string} [msg] - Optional commit message.
     * @returns {Promise} - Resolved when branch updated successfully.
     */
    this.completeTransaction = function ( context, msg ) {
        var deferred = $q.defer(),
            dbConn = dataStoreService.getDatabaseConnection( context.db );

        if ( dbConn.isInTransaction ) {
            dbConn.client.completeTransaction( msg, function ( err ) {
                dbConn.isInTransaction = false;
                if ( err ) {
                    deferred.reject( err );
                } else {
                    deferred.resolve();
                }
            } );
        } else {
            deferred.reject( 'No transaction open!' );
        }

        return deferred.promise;
    };

    /**
     * Logs the regions of the database connection.
     * @param {string} databaseId - Id of database to log.
     */
    this.logContext = function ( databaseId ) {
        var dbConn = dataStoreService.getDatabaseConnection( databaseId );
        logger.debug( 'logContext: ', dbConn );
    };

    NodeObj = function ( context, id ) {
        var thisNode = this;
        this.id = id;
        this.territories = [];
        this.context = context;
        this.databaseConnection = dataStoreService.getDatabaseConnection( context.db );
        // TODO: Should these be arrays of functions? The controller may want to add more methods.
        this._onUpdate = function ( /*id*/) {};
        this._onUnload = function ( /*id*/) {};
        // This will always be called on unload.
        this.__onUnload = function () {
            thisNode.cleanUpNode();
            delete thisNode.databaseConnection.nodeService.regions[ context.regionId ].nodes[ thisNode.id ];
        };
    };

    NodeObj.prototype.cleanUpNode = function () {
        var i;
        // This ought to remove all references to event handlers in the client.
        // In current implementation a NodeObj can own two territories - its own and its 'newchild' terr
        for ( i = 0; i < this.territories.length; i += 1 ) {
            this.databaseConnection.client.removeUI( this.territories[ i ] );
        }
    };

    NodeObj.prototype.getAttribute = function ( name ) {
        return this.databaseConnection.client.getNode( this.id )
            .getAttribute( name );
    };

    NodeObj.prototype.setAttribute = function ( name, value, msg ) {
        this.databaseConnection.client.setAttributes( this.id, name, value, msg );
    };

    NodeObj.prototype.getRegistry = function ( name ) {
        return this.databaseConnection.client.getNode( this.id )
            .getRegistry( name );
    };

    NodeObj.prototype.setRegistry = function ( name, value, msg ) {
        this.databaseConnection.client.setRegistry( this.id, name, value, msg );
    };

    NodeObj.prototype.delRegistry = function ( name, msg ) {
        this.databaseConnection.client.delRegistry( this.id, name, msg );
    };

    /** Gets nodeIds of nodes this node points 'to' and is pointed to 'from'.
     * @param {string} name - name of pointer, e.g. 'src', 'dst'.
     * @returns {object} pointers - object with ids.
     * @returns {string} pointers.to - node id the pointer of this NodeObj points to.
     * @returns {[string]} pointers.from - node ids of nodes that points to this NodeObj through the pointer.
     */
    NodeObj.prototype.getPointer = function ( name ) {
        return this.databaseConnection.client.getNode( this.id )
            .getPointer( name );
    };

    /**
     * Sets pointer named pointer from this node to given node.
     * @param {string} name - name of pointer, e.g. 'src', 'dst'.
     * @param {string} toId - id of node to point to
     * @param {string} [msg] - optional commit message.
     */
    NodeObj.prototype.makePointer = function ( name, toId, msg ) {
        this.databaseConnection.client.makePointer( this.id, name, toId, msg );
    };

    NodeObj.prototype.getCollectionPaths = function ( name ) {
        return this.databaseConnection.client.getNode( this.id )
            .getCollectionPaths( name );
    };

    NodeObj.prototype.getBaseNode = function () {
        // TODO: add proper error handling
        return self.loadNode( this.context, this.getBaseId() );
    };

    NodeObj.prototype.getParentId = function () {
        return this.databaseConnection.client.getNode( this.id )
            .getParentId();
    };

    NodeObj.prototype.getParentNode = function () {
        // TODO: add proper error handling
        return self.loadNode( this.context, this.getParentId() );
    };

    NodeObj.prototype.getId = function () {
        return this.id;
    };

    NodeObj.prototype.getBaseId = function () {
        return this.databaseConnection.client.getNode( this.id )
            .getBaseId();
    };

    NodeObj.prototype.getGuid = function () {
        return this.databaseConnection.client.getNode( this.id )
            .getGuid();
    };

    NodeObj.prototype.getChildrenIds = function () {
        return this.databaseConnection.client.getNode( this.id )
            .getChildrenIds();
    };

    NodeObj.prototype.loadChildren = function () {
        var childrenIds = this.getChildrenIds(),
            queueList = [],
            i;

        for ( i = 0; i < childrenIds.length; i += 1 ) {
            queueList.push( self.loadNode( this.context, childrenIds[ i ] ) );
        }

        return $q.all( queueList );
    };

    NodeObj.prototype.createChild = function ( /*baseNodeOrId, name*/) {

    };

    /**
     * Removes the node from the data-base. (All regions within the same context should get onUnload events).
     * @param [msg] - Optional commit message.
     */
    NodeObj.prototype.destroy = function ( msg ) {
        // TODO: Perhaps remove the node from its context/region at this point? Now it waits for the unload event
        self.destroyNode( this.context, this.id, msg );
    };

    NodeObj.prototype.getMemberIds = function ( name ) {
        return this.databaseConnection.client.getNode( this.id )
            .getMemberIds( name );
    };

    /**
     * Finds the (most specific) meta-node this node inherits from and returns it.
     * @param {Object} metaNodes - MetaNodes given as returned in this.getMetaType
     * @param {Object} metaNodes.byId - Dictionary where keys are the ids of the metaNodes.
     * @returns {NodeObj} - The (most specific) meta-node this node inherits from.
     */
    NodeObj.prototype.getMetaTypeNode = function ( metaNodes ) {
        var node = this.databaseConnection.client.getNode( this.id ),
            metaNode;
        console.assert( typeof metaNodes.byId === 'object' );
        while ( node ) {
            metaNode = metaNodes.byId[ node.getId() ];
            if ( metaNode ) {
                return metaNode;
            }
            node = this.databaseConnection.client.getNode( node.getBaseId() );
        }

        logger.error( 'Could not getMetaTypeNode of ', this.getAttribute( 'name' ), this.id );
        return null;
    };

    /**
     * Finds the name of the (most specific) meta-node this node inherits from and returns it.
     * @param {Object} metaNodes - MetaNodes given as returned in this.getMetaType
     * @param {Object} metaNodes.byId - Dictionary where keys are the ids of the metaNodes.
     * @returns {string} - The name of the (most specific) meta-node this node inherits from.
     */
    NodeObj.prototype.getMetaTypeName = function ( metaNodes ) {
        var metaNode = this.getMetaTypeNode( metaNodes );
        if ( metaNode ) {
            return metaNode.getAttribute( 'name' );
        }
        return null;
    };

    /**
     * Checks if this node inherits from the given metaNode.
     * @param {NodeObj} metaNode
     * @returns {boolean} - True if it inherits from the metaNode.
     */
    NodeObj.prototype.isMetaTypeOf = function ( metaNode ) {
        var node = this.databaseConnection.client.getNode( this.id );

        while ( node ) {
            if ( node.getId() === metaNode.getId() ) {
                return true;
            }
            node = this.databaseConnection.client.getNode( node.getBaseId() );
        }
        return false;
    };

    NodeObj.prototype.onUpdate = function ( fn ) {
        console.assert( typeof fn === 'function' );
        this._onUpdate = fn;
    };

    NodeObj.prototype.onUnload = function ( fn ) {
        console.assert( typeof fn === 'function' );
        this._onUnload = fn;
    };

    NodeObj.prototype.onNewChildLoaded = function ( fn ) {
        var dbConn = this.databaseConnection,
            context = this.context,
            territoryPattern = {},
            id = this.id,
            terrId = context.regionId + '_' + id + '_new_children_watch',
            initializeNewNode;

        initializeNewNode = function ( newNode ) {
            fn( newNode );
            //console.log('Added new territory through onNewChildLoaded ', event.eid);
        };

        //console.log(dbConn);
        if ( this.territories.indexOf( terrId ) > -1 ) {
            logger.warn( 'Children are already being watched for ', terrId );
        } else {
            this.territories.push( terrId );
            dbConn.client.addUI( {}, function ( events ) {
                var i,
                    event;
                for ( i = 0; i < events.length; i += 1 ) {
                    event = events[ i ];
                    if ( event.etype === 'load' ) {
                        if ( dbConn.nodeService.regions[ context.regionId ].nodes.hasOwnProperty( event.eid ) ===
                            false ) {
                            self.loadNode( context, event.eid )
                                .then( initializeNewNode );
                        } else {
                            logger.debug('Node ' + event.eid + ' was loaded in ' + terrId + ' but it already' +
                                ' existed in the nodes of the region: ' + context.regionId);
                        }
                    } else {
                        // These node are just watched for loading..
                    }
                }
            }, terrId );

            territoryPattern[ id ] = {
                children: 1
            };
            dbConn.client.updateTerritory( terrId, territoryPattern );
        }
    };

    getIdFromNodeOrString = function ( nodeOrId ) {
        if ( typeof nodeOrId === 'string' ) {
            return nodeOrId;
        }

        if ( typeof nodeOrId === 'object' ) {
            if ( typeof nodeOrId.getId === 'function' ) {
                return nodeOrId.getId();
            } else {
                logger.error( nodeOrId, ' does not have a getId function' );
            }
        } else {
            logger.error( nodeOrId, ' is not a string nor an object.' );
        }
    };

    this.on = function ( context, eventName, fn ) {
        var dbConn;

        console.assert( typeof context.db === 'string' );
        console.assert( typeof context.regionId === 'string' );
        console.assert( typeof eventName === 'string' );
        console.assert( typeof fn === 'function' );

        dbConn = dataStoreService.getDatabaseConnection( context.db );
        dbConn.nodeService = dbConn.nodeService || {};

        dbConn.nodeService.isInitialized = dbConn.nodeService.isInitialized || false;

        if ( typeof dbConn.nodeService.events === 'undefined' ) {
            branchService.on( context.db, 'initialize', function ( dbId ) {
                var dbConnEvent = dataStoreService.getDatabaseConnection( dbId ),
                    keys,
                    i;

                self.cleanUpAllRegions( dbId );

                if ( dbConnEvent.nodeService &&
                    dbConnEvent.nodeService.events &&
                    dbConnEvent.nodeService.events.initialize ) {
                    // NodeService requires a selected branch.
                    if ( dbConn.branchService.branchId ) {
                        dbConnEvent.nodeService.isInitialized = true;
                        keys = Object.keys(dbConnEvent.nodeService.events.initialize);
                        for ( i = 0; i < keys.length; i += 1 ) {
                            dbConnEvent.nodeService.events.initialize[ keys[ i ] ]( dbId );
                        }
                    }
                }
            } );

            branchService.on( context.db, 'destroy', function ( dbId ) {
                var dbConnEvent = dataStoreService.getDatabaseConnection( dbId ),
                    keys,
                    i;

                self.cleanUpAllRegions( dbId );

                if ( dbConnEvent.nodeService &&
                    dbConnEvent.nodeService.events &&
                    dbConnEvent.nodeService.events.destroy ) {

                    dbConnEvent.nodeService.isInitialized = false;
                    keys = Object.keys(dbConnEvent.nodeService.events.destroy);
                    for ( i = 0; i < keys.length; i += 1 ) {
                        dbConnEvent.nodeService.events.destroy[ keys[ i ] ]( dbId );
                    }
                }
            } );
        }

        dbConn.nodeService.events = dbConn.nodeService.events || {};
        dbConn.nodeService.events[ eventName ] = dbConn.nodeService.events[ eventName ] || {};
        dbConn.nodeService.events[ eventName ][ context.regionId ] = fn;

        if ( dbConn.nodeService.isInitialized || dbConn.branchService.isInitialized ) {
            if ( eventName === 'initialize' ) {
                dbConn.nodeService.isInitialized = true;
                fn( context.db );
            }
        } else {
            if ( eventName === 'destroy' ) {
                dbConn.nodeService.isInitialized = false;
                fn( context.db );
            }
        }
    };

    this.off = function ( context, eventName ) {
        var dbConn;

        console.assert( typeof context.db === 'string' );
        console.assert( typeof context.regionId === 'string' );
        console.assert( typeof eventName === 'string' );

        dbConn = dataStoreService.getDatabaseConnection( context.db );
        if ( !dbConn ) {
            return new Error(context.db + ' does not exist.');
        }
        if ( !dbConn.nodeService ) {
            return new Error(context.db + ' does not have any registered nodeService.');
        }
        if ( !dbConn.nodeService.events ) {
            return new Error(context.db + ' does not have any events for the registered nodeService.');
        }
        if ( !dbConn.nodeService.events[ eventName ] ) {
            return new Error(context.db + ', ' +  eventName + ' event never registered.' );
        }
        if ( !dbConn.nodeService.events[ eventName ][ context.regionId ] ) {
            return new Error(context.db + ', ' + eventName + ', ' + context.regionId +
            ' never registered for given event.' );
        }

        delete dbConn.nodeService.events[ eventName ][ context.regionId ];

        return true;
    };
};
