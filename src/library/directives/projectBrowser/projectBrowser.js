/*globals angular, chance*/
'use strict';

require( '../termFilter/termFilter.js' );

angular.module( 'gme.directives.projectBrowser', [
  'gme.templates',
  'isis.ui.itemList',
  'gme.directives.termFilter'
] )
.run( function () {

} )
.controller( 'ProjectBrowserController', function ( $scope, $log ) {

  var config,
  dummyProjectGenerator,
  i;

  $scope.availableTerms = [
    {
      id: 'tag1',
      name: 'Tag A',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag2',
      name: 'Tag B',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag3',
      name: 'Tag C',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag4',
      name: 'Tag D',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag5',
      name: 'Tag E',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag6',
      name: 'Tag F',
      url: 'http://vanderbilt.edu'
    }
  ];

  $scope.selectedTermIds = [
    'tag1', 'tag3', 'tag4', 'tag5'
  ];

  $scope.projectList = {
    items: []
  };

  dummyProjectGenerator = function ( id ) {

    var projectDescriptor, i, randomTerm;

    projectDescriptor = {
      id: id,
      title: chance.paragraph({sentences: 1}),
      cssClass: 'project-item',
      toolTip: 'Open project',
      description: chance.paragraph({sentences: 2}),
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
      details: chance.paragraph({sentences: 3}),
      detailsTemplateUrl: '/ng-gme/templates/projectDetails.html'
    };

    for(i=0; i<$scope.availableTerms.length-1; i++) {

      if (Math.random() > 0.5) {
        projectDescriptor.taxonomyTerms.push($scope.availableTerms[i]);
      }
    }

    return projectDescriptor;

  };


  for ( i = 0; i < 20; i++ ) {
    $scope.projectList.items.push( dummyProjectGenerator( i ) );
  }

  //$log.debug( $scope.projectList.items );

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
              id: 'create',
              label: 'Create new',
              disabled: true,
              iconClass: 'fa fa-plus'
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
        $scope.createItem = function ( newItem ) {

          newItem.url = 'something';
          newItem.toolTip = newItem.title;

          $scope.projectList.items.push( newItem );

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