/*globals angular*/
'use strict';

angular.module('gme.directives.projectBrowser', [
  'gme.templates'
])
.run(function(){

})
.directive('projectBrowser', function(){

  return {
    scope: false,
    restrict: 'E',
    replace: true,
    templateUrl: '/ng-gme/templates/projectBrowser.html'
  };
});