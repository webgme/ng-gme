angular.module("gme.docs.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/docs/docs_index.html","<!DOCTYPE html>\n<html>\n<head>\n    <title>ISIS UI Components Documentation</title>\n\n    <link href=\'http://fonts.googleapis.com/css?family=Arimo:400,700,400italic,700italic\' rel=\'stylesheet\' type=\'text/css\'>\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"https://code.jquery.com/ui/1.11.1/themes/black-tie/jquery-ui.css\">\n    <link type=\"text/css\" href=\"//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css\" rel=\"stylesheet\">\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"libs/isis-ui-components.css\">\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"libs/ng-grid.min.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"libs/ng-tags-input.bootstrap.min.css\">\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"ng-gme-docs.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"libs/ng-gme.css\">\n\n</head>\n<body ng-cloak>\n<div ng-controller=\"UIComponentsDemoController\" class=\"container\">\n\n    <h1>isis.ui.components</h1>\n\n    <section ng-repeat=\"component in components\" id=\"{{ component.name }}\">\n        <div class=\"page-header\">\n            <h1>{{ component.name }}\n                <small>(isis.ui.{{ component.name }})</small>\n            </h1>\n        </div>\n\n        <div class=\"row demo-piece-container\">\n            <div class=\"col-md-12 show-grid\" ng-include=\"component.template\">\n\n            </div>\n        </div>\n            <div class=\"row\">\n                <tabset class=\"col-md-12\" ng-if=\"component.sources\">\n                    <tab heading=\"Documentation\">\n                        <div class=\"docs-container\" btf-markdown ng-include=\"component.docs\">\n                        </div>\n                    </tab>\n                    <tab ng-repeat=\"sourceFile in component.sources\"\n                         heading=\"{{sourceFile.fileName}}\"\n                         select=\"selectedSourceFile=sourceFile\">\n                        <div ui-codemirror\n                             ui-codemirror-opts=\"sourceFile.viewerOptions\"\n                             ng-model=\"sourceFile.code\"\n                             ui-refresh=\"selectedSourceFile\"\n                             >\n\n                        </div>\n                    </tab>\n                </tabset>\n            </div>\n\n    </section>\n\n</div>\n<script src=\"https://code.jquery.com/jquery-2.1.1.min.js\"></script>\n<script src=\"https://code.jquery.com/ui/1.11.1/jquery-ui.min.js\"></script>\n\n<script src=\"libs/chance.js\"></script>\n\n<script src=\"libs/webgme.classes.build.js\"></script>\n\n<script src=\"libs/angular.min.js\"></script>\n<script src=\"//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js\"></script>\n<script src=\"http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap-tpls.js\"></script>\n\n<script src=\"libs/isis-ui-components.js\"></script>\n<script src=\"libs/isis-ui-components-templates.js\"></script>\n\n<script src=\"libs/ng-grid-2.0.14.min.js\"></script>\n<script src=\"libs/ui-utils.min.js\"></script>\n\n<script src=\"libs/ng-tags-input.min.js\"></script>\n\n<script src=\"libs/ng-gme.js\"></script>\n<script src=\"libs/ng-gme-templates.js\"></script>\n\n<script src=\"ng-gme-docs.js\"></script>\n<script src=\"ng-gme-doc-templates.js\"></script>\n\n<script type=\"text/javascript\">\n    var clientLoaded,\n            timeout = 5000, // 10 seconds\n            waitCounter = 0,\n            i,\n            success,\n            usedClasses = [\'Client\'],\n            interval = 200, // 100 milliseconds interval\n            waitForLoadId = setInterval(function () {\n                if (window.WebGMEGlobal &&\n                    window.WebGMEGlobal.classes) {\n                    // TODO: check for all classes that we use\n                    clearInterval(waitForLoadId);\n                    success = true;\n                    for (i = 0; i < usedClasses.length; i += 1) {\n                        if (window.WebGMEGlobal.classes.hasOwnProperty(usedClasses[i])) {\n                            console.log(\'WebGME \' + usedClasses[i] + \' is available.\');\n                        } else {\n                            console.error(\'WebGME \' + usedClasses[i] + \' was not found.\');\n                            success = false;\n                        }\n                    }\n                    if (success) {\n                        console.log(\'WebGME client library is ready to use.\');\n                        clientLoaded();\n                    }\n                } else {\n                    console.log(\'Waiting for WebGME client library to load.\');\n                    waitCounter += 1;\n                    if (waitCounter >= timeout / interval) {\n                        clearInterval(waitForLoadId);\n                        console.error(\'WebGME client library was not loaded within a reasonable time. (\' + (timeout / 1000) + \' s)\');\n                    }\n                }\n            }, interval);\n    clientLoaded = function () {\n        // main entry point of the app.js\n        // once the webgme Client is loaded and ready we can use it.\n        angular.bootstrap(document, [\'gme.demoApp\']);\n    };\n</script>\n\n</body>\n</html>\n");
$templateCache.put("/library/directives/projectBrowser/docs/demo.html","<div data-ng-controller=\"ProjectBrowserDemoController\" style=\"height: 700px; overflow-x:auto; padding: 0 1ex;\">\n    <project-browser></project-browser>\n</div>");
$templateCache.put("/library/directives/projectService/docs/demo.html","<div data-ng-controller=\"ProjectServiceController\" style=\"height: 700px; overflow-x:auto; padding: 0 1ex;\">\n    <project-service></project-service>\n</div>\n");
$templateCache.put("/docs/docs_app.js","/*globals angular, require, Chance*/\n\'use strict\';\n\nvar components = [\n  {\n    name: \'projectBrowser\',\n    sources: [ \'demo.html\', \'demo.js\']\n  },\n  {\n    name: \'projectService\',\n    sources: [ \'demo.html\', \'demo.js\' ]\n  }\n];\n\nwindow.chance = new Chance();\n\nrequire( \'../library/ng-gme.js\' );\nrequire( \'../library/directives/projectBrowser/docs/demo.js\' );\nrequire( \'../library/directives/projectService/docs/demo.js\' );\n\n\nrequire( \'angular-sanitize\' );\nwindow.Showdown = require( \'showdown\' );\nrequire( \'angular-markdown-directive\' );\n\nrequire( \'codemirror-css\' );\nwindow.CodeMirror = require( \'codemirror\' );\n\nrequire( \'codemirror/mode/htmlmixed/htmlmixed\' );\nrequire( \'codemirror/mode/xml/xml\' );\nrequire( \'codemirror/mode/javascript/javascript\' );\n\nrequire( \'angular-ui-codemirror\' );\n//require( \'ng-grid\' );\n//require( \'ng-grid-css\');\nrequire( \'ui-utils\');\n\n\nvar demoApp = angular.module(\n\'gme.demoApp\', [\n  \'gme.docs.templates\',\n  \'btford.markdown\',\n  \'ui.codemirror\',\n  \'ui.bootstrap\',\n].concat( components.map( function ( e ) {\n  return \'gme.\' + e.name + \'.demo\';\n} ) )\n);\n\ndemoApp.run( function () {\n  console.log( \'DemoApp run...\' );\n\n} );\n\ndemoApp.controller(\n\'UIComponentsDemoController\',\nfunction ( $scope, $templateCache ) {\n\n  var fileExtensionRE,\n    codeMirrorModes;\n\n  fileExtensionRE = /(?:\\.([^.]+))?$/;\n\n  codeMirrorModes = {\n    \'js\': \'javascript\',\n    \'html\': \'htmlmixed\'\n  };\n\n  $scope.components = components.map( function ( component ) {\n    var sources,\n    viewerOptions,\n    fileExtension;\n\n    if ( angular.isArray( component.sources ) ) {\n      sources = component.sources.map( function ( sourceFile ) {\n\n        fileExtension = fileExtensionRE.exec( sourceFile );\n\n        viewerOptions = {\n          lineWrapping: true,\n          lineNumbers: true,\n          readOnly: true,\n          mode: codeMirrorModes[fileExtension[1]] || \'xml\'\n        };\n\n        return {\n          fileName: sourceFile,\n          code: $templateCache.get( \'/library/directives/\' + component.name + \'/docs/\' + sourceFile ),\n          viewerOptions: viewerOptions\n        };\n      } );\n    }\n\n    return {\n      name: component.name,\n      template: \'/library/directives/\' + component.name + \'/docs/demo.html\',\n      docs: \'/library/directives/\' + component.name + \'/docs/readme.md\',\n      sources: sources\n    };\n  } );\n\n} );\n\n\ndemoApp.controller(\'\');\n");
$templateCache.put("/library/directives/projectBrowser/docs/demo.js","/*globals angular*/\n\'use strict\';\n\nvar demoApp = angular.module( \'gme.projectBrowser.demo\', [ \'gme.directives.projectBrowser\' ] );\n\ndemoApp.controller( \'ProjectBrowserDemoController\', function ( $scope, $log ) {\n  $log.debug(\'In ProjectBrowserDemoController\');\n} );\n");
$templateCache.put("/library/directives/projectService/docs/demo.js","/*globals angular*/\n\'use strict\';\n\nvar demoApp = angular.module( \'gme.projectService.demo\', [ \'gme.directives.projectService\' ] );\n\ndemoApp.controller( \'ProjectServiceDemoController\', function ( $scope, $log ) {\n  $log.debug(\'In ProjectServiceDemoController\');\n} );\n");
$templateCache.put("/library/directives/projectBrowser/docs/readme.md","Depends on `ng-tags-input`.");
$templateCache.put("/library/directives/projectService/docs/readme.md","");}]);