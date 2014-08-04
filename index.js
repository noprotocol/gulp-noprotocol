var gutil = require('gulp-util');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');
var es = require('event-stream');
var Buffer = require('buffer').Buffer;

'use strict';
var noprotocol = module.exports = {
  /**
   * Expose gulp plugins
   */
  plugins: {
    gutil: gutil,
    sass: sass,
    concat: concat,
    uglify: uglify,
    ngAnnotate: ngAnnotate,
    sourcemaps: sourcemaps
  },
  /**
   * A gulp-sass stream with improved defaults.
   *
   * @param {Object} [options]
   * @returns {Stream}
   */
  sass: function(options) {
    var options = options || {};
    options.errLogToConsole = true;
    options.outputStyle = 'compressed';
//    options.sourceComments = 'map';  -- Broken in current version of nodejs/libsass
    return sass(options);
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
   * Build an optimized angular app.
   * @param {Array} [deps] Dependancies for the angular.module("app")
   * @returns {Stream}
   */
  angular: function(deps, options) {
    var input = sourcemaps.init({loadMaps: true});
    var output = sourcemaps.write('./');

    var file = new gutil.File({
      path: '__generated__/app.js',
      contents: new Buffer("var app = angular.module('app'," + JSON.stringify(deps) + ");")
    });
    input.write(file); //
    input
      .pipe(ngAnnotate({
        regexp: '^app$',
        add: true
      }))
      .pipe(uglify())
      .pipe(concat('app.min.js'))
      .pipe(output);

    return es.duplex(input, output);
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
  }
};
