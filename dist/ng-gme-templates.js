angular.module("gme.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/ng-gme/templates/newProjectTemplate.html","<form class=\"drop-box new-order-set\">\n    <div class=\"row\">\n        <div class=\"col-md-3\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.id\"\n                   placeholder=\"ID\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-6\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.title\"\n                   placeholder=\"New item name\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <textarea class=\"form-control edit-workspace-description\" rows=\"5\"\n                      data-ng-model=\"newItem.description\"\n                      placeholder=\"Description\"></textarea>\n        </div>\n    </div>\n    <div class=\"row form-footer\">\n        <div class=\"col-md-8\">\n            <button class=\"btn btn-default btn-submit btn-success\"\n                    data-ng-click=\"createItem(newItem)\">Create\n            </button>\n        </div>\n    </div>\n</form>\n");
$templateCache.put("/ng-gme/templates/projectBrowser.html","<div class=\"project-browser\">\n    <item-list list-data=\"projectList\" config=\"config\" class=\"col-md-9\"></item-list>\n    <tag-filter available-tags=\"availableTerms\" selected-tags=\"selectedTerms\"></tag-filter>\n</div>");
$templateCache.put("/ng-gme/templates/projectDetails.html","<div>\n    {{item.details}}\n</div>");
$templateCache.put("/ng-gme/templates/projectService.html","<div>\n  <ul>\n    <li ng-repeat=\'project in projects\'><b>Project Name (and Id):</b> {{ project.visibleName }} ({{ project.visibleName }})\n      <ul>\n        <li>Description: {{ project.description }}</li>\n        <li>Tags: <span ng-repeat=\'tag in project.tags\'>{{ tag }}; </span></li>\n      </ul>\n    </li>\n  </ul>\n</div>\n");
$templateCache.put("/ng-gme/templates/tagFilter.html","<div class=\"tag-filter\">\n    <h4>Filter tags</h4>\n    {{availableTags}}\n</div>");}]);