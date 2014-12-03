angular.module("gme.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/ng-gme/templates/newProjectTemplate.html","<form class=\"drop-box new-order-set\">\n    <div class=\"row\">\n        <div class=\"col-md-6\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.title\"\n                   placeholder=\"New item name\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <textarea class=\"form-control edit-workspace-description\" rows=\"5\"\n                      data-ng-model=\"newItem.description\"\n                      placeholder=\"Description\"></textarea>\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <tags-input ng-model=\"tags\" display-property=\"name\"></tags-input>\n        </div>\n    </div>\n    <div class=\"row form-footer\">\n        <div class=\"col-md-8\">\n            <button class=\"btn btn-default btn-submit btn-success\"\n                    data-ng-click=\"createItem(newItem)\">Create\n            </button>\n        </div>\n    </div>\n</form>\n");
$templateCache.put("/ng-gme/templates/projectBrowser.html","<div class=\"project-browser\">\n    <item-list class=\"col-sm-9\" list-data=\"filteredProjectList\" config=\"config\"></item-list>\n    <div class=\"col-sm-3\">\n        {{availableTerms}}\n        <term-filter available-terms=\"availableTerms\" selected-term-ids=\"filtering.selectedTermIds\"></term-filter>\n    </div>\n</div>");
$templateCache.put("/ng-gme/templates/projectDetails.html","<div>\n    {{item.details}}\n</div>");
$templateCache.put("/ng-gme/templates/projectService.html","<div>\n  <ul>\n    <li><b>Available projects</b>\n      <ul>\n        <li ng-repeat=\'project in projects\'><i>Project Name (and Id):</i> {{ project.visibleName }} ({{ project.visibleName }})\n          <ul>\n            <li>Description: {{ project.description }}</li>\n            <li>Tags: <span ng-repeat=\'tag in project.tags\'>{{ tag }}; </span></li>\n          </ul>\n        </li>\n      </ul>\n    </li>\n    <li><b>Available tags</b>\n      <ul>\n        <li ng-repeat=\'tag in tags\'><i>{{tag.id }}:</i> {{ tag.name }}\n        </li>\n      </ul>\n    </li>\n  </ul>\n</div>\n");
$templateCache.put("/ng-gme/templates/termFilter.html","<div class=\"tag-filter\">\n    <h4>Filter by tags</h4>\n    <div ng-repeat=\"term in availableTerms\"\n         class=\"taxonomy-term\"\n         ng-class=\"term.id + (selectedTermIds.indexOf(term.id) > -1 ? \' selected\' : \'\')\"\n         data-ng-click=\"toggle(term)\">\n        <a href=\"#\" title=\"Change selection\">\n            <span class=\"selected-mark\">\n                <i ng-class=\"selectedTermIds.indexOf(term.id) > -1 ? \'glyphicon glyphicon-ok\' : \'icon-placeholder\'\"></i>\n            </span>{{::term.name}}\n        </a>\n    </div>\n\n    <!--<div ng-repeat=\"term in availableTerms | isSelected: selectedTermIds:-1\"-->\n         <!--class=\"taxonomy-term\"-->\n         <!--ng-class=\"term.id\"-->\n         <!--data-ng-click=\"toggle(term)\">-->\n        <!--<a href=\"#\" title=\"Change selection\">-->\n            <!--<span class=\"selected-mark\">-->\n                <!--<i class=\"icon-placeholder\"></i>-->\n            <!--</span>{{::term.name}}-->\n        <!--</a>-->\n    <!--</div>-->\n</div>");}]);