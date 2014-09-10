'use strict';

// node
var Buffer = require('buffer').Buffer;
var path = require('path');
// npm
var es = require('event-stream');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var templateCache = require('gulp-templatecache');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var noprotocol = module.exports = {
  /**
   * Expose gulp plugins
   */
  plugins: {
    eventStream: es,
    concat: concat,
    ngAnnotate: ngAnnotate,
    sass: sass,
    sourcemaps: sourcemaps,
    templateCache: templateCache,
    uglify: uglify,
    gutil: gutil
  },
  /**
   * A gulp-sass stream with improved defaults.
   * compressed + external sourcemap
   *
   * @param {Object} [options]
   * @returns {Stream}
   */
  sass: function(options) {
    var options = options || {};
    options.errLogToConsole = true;
    options.outputStyle = 'compressed';
    options.sourceComments = 'map';
    var inputSteam = sass(options);
    var outputStream = es.map(function (file, callback ) {
      var contents = file.contents.toString('utf8');
      var pos = contents.indexOf('/*# sourceMappingURL=data:application/json;base64,');
      file.contents = new Buffer(contents.slice(0, pos) + '\n/*# sourceMappingURL=' + path.basename(file.path) + '.map */');
      callback(null, file);
      outputStream.emit('data', new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: file.path + '.map',
        contents: new Buffer(contents.slice(pos + 50, -2), 'base64')
      }));
    });
    inputSteam.pipe(outputStream);
    return es.duplex(inputSteam, outputStream);
  },
  /**
   * Example: gulp.watch('gulpfile.js', noprotocol.exit('gulpfile.js has changed'));
   *
   * @param {String} message
   */
  exit: function(message) {
    return function() {
      gutil.beep();
      gutil.log(message);
      process.exit();
    };
  },
  /**
   * Build an optimized angular module.
   *
   * templateCache & ngAnnotate -> concat -> uglify
   *
   * @param {Object}
   *   module: Name of the angular module
   *   deps: Dependancies for the angular.module("app") (When ommited, no angular.module() is generated)
   *   output:  Filename for the generated output.
   * @returns {Stream}
   */
  angular: function(options) {
    // defaults
    options = options || {};
    options.module = options.module || 'app';
    options.output = options.output || 'main.min.js';
    // create 2 streams, one for scrips and one for templates.
    var angularStream = this._angularModule(options.output, options.deps ? options.module : false, options.deps);
    var templateStream = templateCache({
      output: '__generated__/templates.js',
      moduleName: options.module,
      strip: 'public/',
      minify: {
        collapseWhitespace: true,
        conservativeCollapse: true
      }
    });
    // Split of the html files
    var input = es.map(function(data, callback) {
      if (data.path.substr(-3) === '.js') {
        callback(null, data);
      } else if (data.path.substr(-5) === '.html' || data.path.substr(-4) === '.htm') {
        templateStream.write(data);
        callback();
      } else {
        callback(new Error('Unexpected extension, expecting "*.js" or "*.html" but got "' + data.path + '"'));
      }
    });
    //
    input.pipe(angularStream, {end: false});
    templateStream.pipe(angularStream);
    input.on('end', function() {
      templateStream.end();
    });
    return es.duplex(input, angularStream);
  },
  /**
   *
   * @param {String} output  The name of the concatenated output file.
   * @param {String} [module]  The name of the module (When set, a angular.module declaration file is generated)
   * @param {String} [deps]
   * @returns {unresolved}
   */
  _angularModule: function(output, module, deps) {
    var inputStream = sourcemaps.init({loadMaps: true});
    var outputStream = sourcemaps.write('./');

    if (module) {
      deps = deps || [];
      var file = new gutil.File({
        path: '__generated__/' + module + '.js',
        contents: new Buffer("var " + module + " = angular.module('" + module + "'," + JSON.stringify(deps) + ");")
      });
      inputStream.write(file);
    }
    var annotateStream = ngAnnotate({
      regexp: '^' + module + '$',
      add: true
    });
    annotateStream.on('error', function(e) {
      gutil.log(gutil.colors.red(e.message));
      var file = new gutil.File({
        path: '__generated__/gulpfile.js',
        contents: new Buffer("console.error('[gulp]', " + JSON.stringify(e.message) + ");")
      });
      annotateStream.end(file);
    });

    inputStream
      .pipe(annotateStream)
      .pipe(concat(output))
      .pipe(uglify())
      .pipe(outputStream);

    return es.duplex(inputStream, outputStream);
  },
  /**
   * Concat javascript files and generate a sourcemap.
   *
   * @param {String} The filename for the combined output
   * @returns {Stream}
   */
  concat: function(filename) {
    var input = sourcemaps.init({loadMaps: true});
    var output = sourcemaps.write('./');

    input
      .pipe(concat(filename))
      .pipe(output);

    return es.duplex(input, output);
  },
  /**
   * Bundle javascript files, optional ugliy and generate a sourcemap
   *
   * @param  {Object}
   *   :filename Name of the bundled file
   *   :uglify   Use uglify on the bundled file
   * @return {Stream}
   */
  bundle: function(options) {
    var filename = options.filename || 'libs.bundle.js';
    var uglify = options.uglify || false;

    var input = sourcemaps.init({loadMaps: true});
    var output = sourcemaps.write('./');

    input
      .pipe(concat(filename));

    if (uglify) {
      input
        .pipe(uglify());
    }
    
    input
      .pipe(output);

    return es.duplex(input, output);
  }
};
