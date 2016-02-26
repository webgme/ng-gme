/*globals angular, console, window, require*/

var testApp = angular.module('testApp', ['gme.services'])
    .config(function () {
    })
    .controller("blactrl", function ($q, $scope, dataStoreService, projectService, nodeService) {
        'use strict';
        var context = {
                db: 'APPTEST',
                project: 'appTest',
                regionId: "myregion"
            }, i,
            notInMeta = function (nodeObj) {
                if (meta.byId[nodeObj.id]) {
                    return false;
                }
                return true;
            },
            meta = {},
            root, models = {},
            duplicateModel = function (modelId) {
                createModel(modelId + '_duplicate');
            },
            createModel = function (newId) {
                nodeService.createNode(context, root, meta.byName['FCO'], "app created a new state")
                    .then(function (newNode) {
                        var n1 = newNode.setAttribute('name', newId),
                            s1 = nodeService.createNode(context, newNode, meta.byName['FCO'], "cs1"),
                            s2 = nodeService.createNode(context, newNode, meta.byName['FCO'], "cs2"),
                            s3 = nodeService.createNode(context, newNode, meta.byName['FCO'], "cs3"),
                            c1 = nodeService.createNode(context, newNode, meta.byName['FCO'], "cc1"),
                            c2 = nodeService.createNode(context, newNode, meta.byName['FCO'], "cc2");

                        $q.all([n1, s1, s2, s3, c1, c2]).then(function (nodes) {
                            var n1 = nodes[1].setAttribute('name', 1, "n1"),
                                n2 = nodes[2].setAttribute('name', 2, "n2"),
                                n3 = nodes[3].setAttribute('name', 3, "n3"),
                                p1 = nodes[4].makePointer('src', nodes[1].getId(), 'c1src'),
                                p2 = nodes[4].makePointer('dst', nodes[2].getId(), 'c1dst'),
                                p3 = nodes[5].makePointer('src', nodes[2].getId(), 'c2src'),
                                p4 = nodes[5].makePointer('dst', nodes[3].getId(), 'c2dst');

                            $q.all([n1, n2, n3, p1, p2, p3, p4]).then(function (results) {
                                console.log('we are done');
                            });
                        });
                    });
            };
        dataStoreService.connectToDatabase(context.db, {host: window.location.basename})
            .then(function () {
                projectService.selectProject(context.db, 'guest+' + context.project)
                    .then(function () {
                        nodeService.getMetaNodes(context)
                            .then(function (m) {
                                meta = m;
                                nodeService.loadNode(context, '')
                                    .then(function (r) {
                                        root = r;
                                        root.loadChildren().then(function (children) {
                                            $scope.modelIds = [];
                                            for (i = 0; i < children.length; i++) {
                                                if (notInMeta(children[i])) {
                                                    models[children[i].getAttribute('name')] = children[i];
                                                    $scope.modelIds.push(children[i].getAttribute('name'));
                                                }
                                            }
                                            $scope.duplicate = createModel;
                                            $scope.newModelName = "";
                                        });
                                    });
                            });
                    })
                    .catch(function (reason) {
                        console.error(reason);
                    });
            })
            .catch(function (reason) {
                console.error(reason);
            });

    });