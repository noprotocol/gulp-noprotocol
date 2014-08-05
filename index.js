var gutil = require('gulp-util');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');
var es = require('event-stream');
var Buffer = require('buffer').Buffer;
var templateCache = require('gulp-templatecache');

'use strict';
var noprotocol = module.exports = {
  /**
   * Expose gulp plugins
   */
  plugins: {
    gutil: gutil,
    sourcemaps: sourcemaps,
    sass: sass,
    concat: concat,
    uglify: uglify,
    ngAnnotate: ngAnnotate,
    templateCache: templateCache
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
   *
   * @param {Array} [deps] Dependancies for the angular.module("app")
   * @returns {Stream}
   */
  angular: function (deps) {
    // create 2 streams, one for scrips and one for templates.
    var angularStream = this._angularApp(deps);
    var templateStream = templateCache({
      output: '__generated__/templates.js',
      moduleName: 'app',
      strip: 'public/',
      minify: {
        collapseWhitespace: true,
        conservativeCollapse: true
      }
    });
    // Split of the html files
    var input = es.map(function (data, callback) {
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
    input.on('end', function () {
        templateStream.end();
    });
    return es.duplex(input, angularStream);
  },

  _angularApp: function(deps) {
    var input = sourcemaps.init({loadMaps: true});
    var output = sourcemaps.write('./');

    var file = new gutil.File({
      path: '__generated__/app.js',
      contents: new Buffer("var app = angular.module('app'," + JSON.stringify(deps) + ");")
    });
    input.write(file);
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
