/*globals angular*/
'use strict';

angular.module(
'gme.directives.tagFilter', [
  'isis.ui.taxonomyTerm'
]

)
.controller( 'TagFilterController', function ( $scope ) {

  $scope.tagClick = function(tag) {

  };

} )
.directive(
'tagFilter',
function () {

  return {
    scope: {
      availableTags: '=',
      selectedTags: '='
    },
    controller: 'TagFilterController',
    restrict: 'E',
    replace: true,
    templateUrl: '/ng-gme/templates/tagFilter.html'
  };
} );

