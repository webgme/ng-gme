'use strict';

var

argv = require( 'yargs' ).argv,
livereloadport = 35729,
serverport = 5000,

debug = !argv['production'],
debugShim = false, //this is for toggling browserify shim debug

libraryName = 'ng-gme',
libraryTemplatesModule = 'gme.templates',

docTemplatesModule = 'gme.docs.templates',

docLibs = [
  'bower_components/isis-ui-components/dist/isis-ui-components.css',
  'bower_components/isis-ui-components/dist/isis-ui-components.js',
  'bower_components/isis-ui-components/dist/isis-ui-components-templates.js',
  'bower_components/angular-ui-utils/ui-utils.min.js',
  'bower_components/ng-grid/ng-grid-2.0.14.min.js',
  'bower_components/ng-grid/ng-grid.min.css',
  'bower_components/angular/angular.min.js',
  'bower_components/angular/angular.min.js.map',
  'bower_components/chance/chance.js',
  'bower_components/ng-tags-input/ng-tags-input.min.js',
  'bower_components/ng-tags-input/ng-tags-input.bootstrap.min.css',
  'dist/ng-gme.css',
  'dist/ng-gme.js',
  'dist/ng-gme-templates.js',
  'node_modules/webgme/dist/webgme.classes.build.js',
  'node_modules/angular-sanitize/angular-sanitize.min.js'
],

sourcePaths = {

  docsSourceIndex: 'src/docs/docs_index.html',
  docsApp: './src/docs/docs_app.js',
  docsScripts: [
    'src/**/docs/*.js'
  ],
  docsTemplates: [
    'src/**/docs/*.html',
    'src/**/docs/*.js',
    'src/**/docs/readme.md'
  ],
  docsStyles: [
    'src/docs/styles/*.scss',
    'src/library/*/docs/**/*.scss'
  ],


  libraryModuleScript: './src/library/ng-gme.js',
  libraryScripts: [
    'src/library/**/*.js'
  ],
  libraryTemplates: [
    'src/**/templates/**/*.html'
  ],
  libraryStyles: [
    'src/library/styles/*.scss',
    'src/library/*/styles/*.scss',
    'src/library/*/*/styles/*.scss'
  ],
  libraryImages: [
    'src/**/*.png',
    'src/**/*.jpg',
    'src/**/*.svg'
  ]
},

buildPaths = {

  root: 'dist',
  docsRoot: 'dist/docs',

  scripts: 'dist',
  templates: 'dist/templates',
  styles: 'dist/styles',
  images: 'dist/images'
},

gulp = require( 'gulp' ),
jshint = require( 'gulp-jshint' ),
browserify = require( 'browserify' ),
source = require( 'vinyl-source-stream' ),
concat = require( 'gulp-concat' ),
buffer = require( 'gulp-buffer' ),
sourcemaps = require( 'gulp-sourcemaps' ),
rename = require( 'gulp-rename' ),
sass = require( 'gulp-sass' ),
runSequence = require( 'run-sequence' ),
templateCache = require( 'gulp-angular-templatecache' ),

express = require( 'express' ),
server = express(),
livereload = require( 'connect-livereload' ),
refresh = require( 'gulp-livereload' ),
lrserver = require( 'tiny-lr' )(),
prettify = require( 'gulp-js-prettify' ),
gutil = require( 'gutil' );

// Utility tasks

require( 'path' );

function swallowError( error ) {

  //If you want details of the error in the console
  console.log( error.toString() );

  this.emit( 'end' );
}

gulp.task( 'clean-build', function (cb) {
  require('del')([
    'dist/**/*',
    '!dist/.npmignore',
    '!dist/.gitignore'
  ], cb);
} );


// Docs tasks

gulp.task( 'lint-docs', function () {

  console.log( 'Linting docs...' );

  gulp.src( sourcePaths.docsScripts )
  .pipe( jshint() )
  .pipe( jshint.reporter( 'default' ) );

} );

gulp.task( 'browserify-docs', function () {
  var bundler, bundle;
  console.log('Browserifying docs...');

  if (debugShim) {
    process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;
  }
  bundler = browserify({
    entries: [ sourcePaths.docsApp ],
    debug: true
  });

  bundle = function() {
    return bundler
      .bundle()
      .on('error', swallowError)
      .pipe(source(libraryName + '-docs.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      // Add transformation tasks to the pipeline here.
      //.pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildPaths.docsRoot));
  };
  return bundle();
} );

gulp.task( 'compile-docs-templates', function () {

  console.log( 'Compiling docs templates...' );

  gulp.src( sourcePaths.docsTemplates )
  .pipe( templateCache( libraryName + '-doc-templates.js', {
    root: '/',
    module: docTemplatesModule,
    standalone: true
  } ) )
  .pipe( gulp.dest( buildPaths.docsRoot ) );
} );


gulp.task( 'compile-docs-styles', function () {

  console.log( 'Compiling styles...' );

  gulp.src( sourcePaths.docsStyles )
  .pipe( sass( {
    errLogToConsole: true,
    sourceComments: 'map'
  } ) )
  .pipe( rename( function ( path ) {
    path.dirname = '';
  } ) )
  .pipe( concat( libraryName + '-docs.css' ) )
  .pipe( gulp.dest( buildPaths.docsRoot ) );
} );

gulp.task( 'compile-docs',
[ 'lint-docs', 'browserify-docs', 'compile-docs-templates', 'compile-docs-styles' ],
function () {

  console.log( 'Compiling docs...' );

  gulp.src( sourcePaths.docsSourceIndex )
  .pipe( rename( 'index.html' ) )
  .pipe( gulp.dest( buildPaths.docsRoot ) );

  gulp.src( docLibs )
  .pipe( rename( function ( path ) {
    path.dirname = 'libs';
  } ) )
  .pipe( gulp.dest( buildPaths.docsRoot ) );
} );


// Library tasks

gulp.task( 'lint-library', function () {

  console.log( 'Linting library...' );

  gulp.src( sourcePaths.libraryScripts )
  .pipe( jshint() )
  .pipe( jshint.reporter( 'default' ) );

} );

gulp.task( 'browserify-library', function () {
  var bundler, bundle;
  console.log('Browserifying library...');

  if (debugShim) {
    process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;
  }
  bundler = browserify({
    entries: [sourcePaths.libraryModuleScript],
    debug: true
  });

  bundle = function() {
    return bundler
      .bundle()
      .on('error', swallowError)
      .pipe(source(libraryName + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      // Add transformation tasks to the pipeline here.
      //.pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildPaths.scripts));
  };

  return bundle();
} );

gulp.task( 'compile-library-templates', function () {

  console.log( 'Compiling templates...' );

  gulp.src( sourcePaths.libraryTemplates )
  .pipe( rename( function ( path ) {
    path.dirname = 'templates';
  } ) )
  .pipe( templateCache( libraryName + '-templates.js', {
    module: libraryTemplatesModule,
    standalone: true,
    root: '/' + libraryName + '/'
  } ) )
  .pipe( gulp.dest( buildPaths.root ) );
} );


gulp.task( 'compile-library-styles', function () {

  console.log( 'Compiling styles...' );

  gulp.src( sourcePaths.libraryStyles )
    // The onerror handler prevents Gulp from crashing when you make a mistake in your SASS
  .pipe( sass( {
    errLogToConsole: true,
    sourceComments: 'map'
  } ) )
  .pipe( rename( function ( path ) {
    path.dirname = '';
  } ) )
  .pipe( concat( libraryName + '.css' ) )
  .pipe( gulp.dest( buildPaths.root ) );
} );

gulp.task( 'compile-library-images', function () {

  console.log( 'Compiling images...' );

  gulp.src( sourcePaths.libraryImages )
  .pipe( rename( function ( path ) {
    path.dirname = '';
  } ) )
  .pipe( gulp.dest( buildPaths.images ) );
} );


gulp.task( 'compile-library',
[ 'lint-library', 'browserify-library', 'compile-library-templates', 'compile-library-styles', 'compile-library-images'],
function () {
  console.log( 'Compiling scripts...' );
} );


gulp.task( 'compile-all', function ( cb ) {
  runSequence( 'clean-build', [
    'compile-library', 'compile-docs',
  ], cb );
} );


// Prettifying
gulp.task( 'prettify', function () {
  gulp.src( './src/**/*.js' )
  .pipe( prettify( {
    'indent_size': 4,
    'indent_char': ' ',
    'space_in_paren': true,
    'indent_level': 0,
    'indent_with_tabs': false,
    'preserve_newlines': true,
    'max_preserve_newlines': 10,
    'jslint_happy': true,
    'brace_style': 'collapse',
    'keep_array_indentation': false,
    'keep_function_indentation': false,
    'space_before_conditional': true,
    'break_chained_methods': true,
    'eval_code': false,
    'unescape_strings': false,
    'wrap_line_length': 120
  } ) )
  .pipe( gulp.dest( './src' ) ); // edit in place
} );

// Server scripts

gulp.task( 'start-server', function () {

  console.log( 'Starting server...' );

  server.use( livereload( { port: livereloadport } ) );
  server.use( express.static( buildPaths.root ) );


  server.get( '/', function ( req, res ) {
    res.sendFile( buildPaths.index, {
      root: buildPaths.root
    } );
  } );

  server.listen( serverport );
  lrserver.listen( livereloadport );

} );


gulp.task( 'refresh-server', function () {

  console.log( 'Refreshing server...' );

  refresh( lrserver );
} );


gulp.task( 'register-watchers', [ 'compile-all' ], function ( cb ) {
  gulp.watch( sourcePaths.index, [ 'compile-index', 'refresh-server' ] );

  gulp.watch( sourcePaths.docsSourceIndex, [ 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.docsApp, [ 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.docsScripts, [ 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.docsTemplates, [ 'compile-docs-templates', 'refresh-server' ] );
  gulp.watch( sourcePaths.docsStyles, [ 'compile-docs-styles', 'refresh-server' ] );

  gulp.watch( sourcePaths.libraryModuleScript, [ 'compile-library', 'refresh-server' ] );
  gulp.watch( sourcePaths.libraryScripts, [ 'compile-library', 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.libraryTemplates, [ 'compile-library-templates', 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.libraryStyles, [ 'compile-library-styles', 'compile-docs', 'refresh-server' ] );
  gulp.watch( sourcePaths.libraryImages, [ 'compile-library-images', 'refresh-server' ] );

  return cb;
} );

// Dev task
gulp.task( 'dev', [ 'compile-all' ], function ( cb ) {

  runSequence( 'start-server', 'register-watchers', cb );

} );
