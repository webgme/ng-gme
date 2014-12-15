/*globals angular, chance*/
'use strict';

require( '../termFilter/termFilter.js' );

angular.module( 'gme.directives.projectBrowser', [
  'gme.templates',
  'isis.ui.itemList',
  'gme.directives.termFilter',
  'ngTagsInput',
  'gme.testServices'
] )
.run( function () {

} )
.controller( 'ProjectBrowserController', function ( $scope, $log, $filter, projectServiceTest, projectService ) {

  var config,
  dummyProjectGenerator,

  projectDescriptorMapper,

  filterItems,
  projectList,
  availableTerms;

  availableTerms = $scope.availableTerms = [];

//  availableTerms = $scope.availableTerms = [
//    {
//      id: 'tag1',
//      name: 'Tag A',
//      url: 'http://vanderbilt.edu'
//    },
//    {
//      id: 'tag2',
//      name: 'Tag B',
//      url: 'http://vanderbilt.edu'
//    },
//    {
//      id: 'tag3',
//      name: 'Tag C',
//      url: 'http://vanderbilt.edu'
//    },
//    {
//      id: 'tag4',
//      name: 'Tag D',
//      url: 'http://vanderbilt.edu'
//    },
//    {
//      id: 'tag5',
//      name: 'Tag E',
//      url: 'http://vanderbilt.edu'
//    },
//    {
//      id: 'tag6',
//      name: 'Tag F',
//      url: 'http://vanderbilt.edu'
//    }
//  ];


  $scope.filtering = {
    selectedTermIds: [

    ]
  };

  projectList = $scope.projectList = {
    items: []
  };

  $scope.filteredProjectList = {
    items: []
  };


  filterItems = function () {
    $scope.filteredProjectList.items = $filter( 'termFilter' )( $scope.projectList.items,
    $scope.filtering.selectedTermIds );
  };

  $scope.$watch( function () {

    return $scope.filtering.selectedTermIds;
  }, function () {
    filterItems();
  },
  true );


  $scope.$watch( 'filtering.selectedTermIds', function () {
    filterItems();
  } );

  $scope.$watch( 'projectList.items', function () {
    filterItems();
  } );

  dummyProjectGenerator = function ( id ) {

    var projectDescriptor, i;

    projectDescriptor = {
      id: id,
      title: chance.paragraph( {
        sentences: 1
      } ),
      cssClass: 'project-item',
      toolTip: 'Open project',
      description: chance.paragraph( {
        sentences: 2
      } ),
      lastUpdated: {
        time: Date.now(),
        user: 'N/A'

      },
      taxonomyTerms: [],
      stats: [
        {
          value: id,
          toolTip: 'Commits',
          iconClass: 'fa fa-cloud-upload'
        },
        {
          value: id,
          toolTip: 'Users',
          iconClass: 'fa fa-users'
        }
      ],
      details: chance.paragraph( {
        sentences: 3
      } )
    };

    for ( i = 0; i < $scope.availableTerms.length - 1; i++ ) {

      if ( Math.random() > 0.5 ) {
        projectDescriptor.taxonomyTerms.push( $scope.availableTerms[ i ] );
      }
    }

    return projectDescriptor;

  };

//  for (i = 0; i < 20; i++) {
//    $scope.projectList.items.push(dummyProjectGenerator(i));
//  }

  projectDescriptorMapper = function ( projectDescriptors ) {

    var result = [];

    angular.forEach( projectDescriptors, function ( projectDescriptor ) {

      console.log( projectDescriptor );

      result.push( {

        id: projectDescriptor.id,
        description: projectDescriptor.info.description,
        title: projectDescriptor.info.visibleName,
        taxonomyTerms: projectDescriptor.info.tags

      } );

    } );

    return result;

  };

  // Making sure we have test project in DB

  projectServiceTest.startTest().then( function () {


    projectService.getAvailableProjectTags( 'multi' ).then( function ( tagList ) {

      $scope.availableTerms = tagList;

    } );

    console.log( 'In here...' );

    projectService.getProjects( 'multi' ).then( function ( gmeProjectDescriptors ) {

      $scope.projectList.items = [];
      $scope.projectList.items = projectDescriptorMapper( gmeProjectDescriptors );

      //$scope.projectList.items = results;
    } );

  } );

  $scope.config = config = {

    sortable: true,
    secondaryItemMenu: true,
    detailsCollapsible: true,
    showDetailsLabel: 'Show details',
    hideDetailsLabel: 'Hide details',
    filter: {},

    // Event handlers

    itemSort: function ( jQEvent, ui ) {
      console.log( 'Sort happened', jQEvent, ui );
    },

    itemClick: function ( event, item ) {
      console.log( 'Clicked: ' + item );
    },

    itemContextmenuRenderer: function ( e, item ) {
      console.log( 'Contextmenu was triggered for node:', item );

      return [
        {
          items: [

            {
              id: 'open',
              label: 'Open Project',
              disabled: false,
              iconClass: ''
            }
          ]
        },
        {
          items: [
            {
              id: 'edit',
              label: 'Edit Project Details',
              disabled: false,
              iconClass: ''
            },
            {
              id: 'delete',
              label: 'Delete Project',
              disabled: false,
              iconClass: ''
            }
          ]
        }
      ];
    },

    detailsRenderer: function ( item ) {
      item.details = 'My details are here now!';
    },

    newItemForm: {
      title: 'Create new Project',
      itemTemplateUrl: '/ng-gme/templates/newProjectTemplate.html',
      expanded: false,
      controller: function ( $scope ) {

        $scope.newItem = {};

        $scope.tags = angular.copy( availableTerms );

        $scope.createItem = function ( newItem ) {

          projectService.createProject(
          newItem.title,
          newItem.title,
          {
            visibleName: newItem.title,
            tags: newItem.tags,
            description: newItem.description
          }
          ).then( function ( e ) {
            console.log( e );
          } );

          $scope.newItem = {};

          config.newItemForm.expanded = false; // this is how you close the form itself

        };

      }
    }

  };


} )
.directive( 'projectBrowser', function () {

  return {
    scope: false,
    restrict: 'E',
    controller: 'ProjectBrowserController',
    replace: true,
    templateUrl: '/ng-gme/templates/projectBrowser.html'
  };
} );
