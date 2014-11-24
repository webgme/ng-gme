/*globals angular*/
'use strict';

angular.module(
'gme.directives.termFilter', [
  'isis.ui.taxonomyTerm'
]

)
.filter('isSelected', [ function(){
  return function(input, selectedTermIds, direction) {
    var output = [];

    angular.forEach(input, function(term) {

      if (direction === -1) {

        if (selectedTermIds.indexOf(term.id) === -1) {
          output.push(term);
        }

      } else {

        if (selectedTermIds.indexOf(term.id) > -1) {
          output.push(term);
        }

      }
    });

    return output;

  };
}])
.filter('termFilter', function() {
  return function(input, selectedTermIds){

    var output = [];

    if (angular.isArray(selectedTermIds)) {

      angular.forEach(input, function(elem) {

        angular.forEach(elem.taxonomyTerms, function(aTerm) {

          if (selectedTermIds.indexOf(aTerm.id) > -1) {
            output.push(elem);
            return;
          }

        });

      });

    }

    return output;

  };
})
.controller( 'TermFilterController', function ( $scope ) {

  $scope.toggle = function(term) {

    var index;

    index = $scope.selectedTermIds.indexOf(term.id);

    if (index === -1) {
      $scope.selectedTermIds.push(term.id);
    } else {
      $scope.selectedTermIds.splice(index, 1);
    }
  };

} )
.directive(
'termFilter',
function () {

  return {
    scope: {
      availableTerms: '=',
      selectedTermIds: '='
    },
    controller: 'TermFilterController',
    restrict: 'E',
    replace: true,
    templateUrl: '/ng-gme/templates/termFilter.html'
  };
} );

