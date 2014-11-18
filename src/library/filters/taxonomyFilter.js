/*globals angular*/
'use strict';

angular.module(
'gme.filters.taxonomyFilter', []
)
.filter('taxonomyFilter', function() {
  return function(input, selectedTerms){

    var output = [];

    if (angular.isArray(selectedTerms)) {

      angular.forEach(input, function(elem) {

        angular.forEach(elem.taxonomyTerms, function(aTerm) {

          if (selectedTerms.indexOf(aTerm) > -1) {
            output.push(elem);
            return;
          }

        });

      });

    }

    return output;

  };
});

