/*globals angular, console, window, require*/

var testApp = angular.module('testApp', ['gme.services'])
    .config(function () {})
    .controller("blactrl",function ($q,$scope,dataStoreService, projectService, nodeService) {
        'use strict';
        var context = {
                db:'APPTEST',
                project:'appTest',
                regionId:"myregion"
            }, i,
            notInMeta = function(nodeObj){
                var keys = Object.keys(meta),
                    i;
                for(i=0;i<keys.length;i++){
                    if(nodeObj.getGuid() === meta[keys[i]].getGuid()){
                        return false;
                    }
                }
                return true;
            },
            meta={},
            root, models = {},
            duplicateModel = function(modelId){
                createModel(modelId+'_duplicate');
            },
            createModel = function(newId){
                nodeService.createNode(context,root,meta['state'],"app created a new state")
                    .then(function(newNode){
                        var n1 = newNode.setAttribute('name',newId),
                            s1 =nodeService.createNode(context,newNode,meta['state'],"cs1"),
                            s2 =nodeService.createNode(context,newNode,meta['state'],"cs2"),
                            s3 =nodeService.createNode(context,newNode,meta['state'],"cs3"),
                            c1 = nodeService.createNode(context,newNode,meta['transition'],"cc1"),
                            c2 = nodeService.createNode(context,newNode,meta['transition'],"cc2");

                        $q.all([n1,s1,s2,s3,c1,c2]).then(function(valami){
                            var n1 = valami[1].setAttribute('name',1,"n1"),
                                n2 = valami[2].setAttribute('name',2,"n2"),
                                n3 = valami[3].setAttribute('name',3,"n3"),
                                p1 = valami[4].makePointer('src',valami[1].getId(),'c1src'),
                                p2 = valami[4].makePointer('dst',valami[2].getId(),'c1dst'),
                                p3 = valami[5].makePointer('src',valami[2].getId(),'c2src'),
                                p4 = valami[5].makePointer('dst',valami[3].getId(),'c2dst');

                            $q.all([n1,n2,n3,p1,p2,p3,p4]).then(function(results){
                                console.log('we are done');
                            });
                        });

                        /*nodeService.setAttributes(context,newNode.getId(),'name',newId,"setting new model's name");
                         nodeService.createNode(context,newNode,meta['state'],"cs1").then(function(cs1){nodeService.setAttributes(context,cs1.getId(),'name','1',"name 1");});
                         nodeService.createNode(context,newNode,meta['state'],"cs2").then(function(cs2){nodeService.setAttributes(context,cs2.getId(),'name','2',"name 2");});
                         nodeService.createNode(context,newNode,meta['state'],"cs1").then(function(cs1){nodeService.setAttributes(context,cs1.getId(),'name','3',"name 3");});*/
                    });
            };
        dataStoreService.connectToDatabase(context.db,{host:window.location.basename})
            .then(function(){
                projectService.selectProject(context.db,context.project)
                    .then(function(){
                        nodeService.getMetaNodes(context)
                            .then(function(m){
                                meta = m;
                                nodeService.loadNode(context,'')
                                    .then(function(r){
                                        root = r;
                                        root.loadChildren().then(function(children){
                                            $scope.modelIds = [];
                                            for(i=0;i<children.length;i++){
                                                if(notInMeta(children[i])){
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
                    .catch(function(reason){
                        console.error(reason);
                    });
            })
            .catch(function(reason){
                console.error(reason);
            });

    });