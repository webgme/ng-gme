/*globals angular*/
'use strict';

require( '../tagFilter/tagFilter.js' );
require( '../../filters/taxonomyFilter.js' );

angular.module( 'gme.directives.projectBrowser', [
  'gme.templates',
  'isis.ui.itemList',
  'gme.directives.tagFilter',
  'gme.filters.taxonomyFilter'
] )
.run( function () {

} )
.controller( 'ProjectBrowserController', function ( $scope, $log ) {

  var config,
  projectList,
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
      name: 'Tag B',
      url: 'http://vanderbilt.edu'
    }

  ];

  $scope.selectedTerms = [
    {
      id: 'tag1',
      name: 'Tag A',
      url: 'http://vanderbilt.edu'
    },
    {
      id: 'tag3',
      name: 'Tag B',
      url: 'http://vanderbilt.edu'
    }

  ];

  $scope.projectList = projectList = {
    items: []
  };

  dummyProjectGenerator = function ( id ) {
    return {
      id: id,
      title: 'The world as I modeled ' + id,
      cssClass: 'project-item',
      toolTip: 'Open project',
      description: 'We believe in domain-specific modeling and not coding just generating stuff. ' +
      'Just like this line was generated here with good care.',
      lastUpdated: {
        time: Date.now(),
        user: 'N/A'

      },
      taxonomyTerms: [
        {
          id: 'tag1',
          name: 'Tag A',
          url: 'http://vanderbilt.edu'
        },
        {
          id: 'tag2',
          name: 'Tag B',
          url: 'http://vanderbilt.edu'
        }
      ],
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
      details: 'Some detailed text. Lorem ipsum ama fea rin the poc ketofmyja cket.',
      detailsTemplateUrl: '/ng-gme/templates/projectDetails.html'
    };
  };


  for ( i = 0; i < 20; i++ ) {
    $scope.projectList.items.push( dummyProjectGenerator( i ) );
  }

  $log.debug( $scope.projectList.items );

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