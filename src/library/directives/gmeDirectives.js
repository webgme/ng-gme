/*globals angular*/
'use strict';

require('./projectBrowser/projectBrowser.js');
require('./projectService/projectService.js');

angular.module('gme.directives',
[
  'gme.templates',
  'gme.directives.projectBrowser',
  'gme.directives.projectService'
]);
