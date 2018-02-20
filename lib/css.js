/**
 * noprotocol.css()
 *
 * Input: clean sass or css
 * Output: prefixed, minified, sourcemapped css file.
 *
 * Usage:
 * gulp.src('./sass/*.scss')
 *   .pipe(noprotocol.css())
 *   .on('error', noprotocol.notify)
 *   .pipe(gulp.dest('./dest'));
 */

const sass = require("gulp-sass");
const es = require("event-stream");
const path = require("path");
const combine = require("stream-combiner2").obj;
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const csso = require("postcss-csso");
const autoprefixer = require("autoprefixer");

// constants
var NoProtocolBrowserSupport = ['Last 2 versions', 'IE >= 11'];
/**
 * Gulp stream that outputs css.
 *
 * - sass
 * - autoprefixer
 * - csso
 *
 * @param {Object} options {
 *   minify: Boolean (default: true)
 *   browsers: Array (default: NoProtocolBrowserSupport)
 * }
 */
module.exports = function css(options) {
  // Configuration
  options = options || {};
  options.minify =
    typeof options.minify === "undefined" ? true : options.minify;
  options.autoprefixer = options.autoprefixer || {};
  options.autoprefixer.browsers =
    options.autoprefixer.browsers ||
    options.browsers ||
    NoProtocolBrowserSupport;

  options.sass = options.sass || {};
  if (options.minify) {
    options.sass.outputStyle = options.sass.outputStyle || "compressed";
  }
  //
  // Preprocessor(s)
  //
  const sassStream = sass(options.sass);
  const cssStream = es.map(function filter(file, callback) {
    switch (path.extname(file.path)) {
      case ".css":
        sassStream.emit("data", file);
        callback();
        return;
      case ".scss":
      case ".sass":
        sassStream.write(file);
        callback();
        return;
      default:
        callback(
          new Error(
            'No preprocessor configured for "' + path.extname(file.path) + '"'
          )
        );
        return;
    }
  });
  cssStream.on("end", function() {
    sassStream.end();
  });
  const preprocessors = es.duplex(cssStream, sassStream);
  //
  // Postprocessors
  //
  const postprocessors = [autoprefixer(options.autoprefixer)];
  if (options.minify) {
    postprocessors.push(csso(options.csso));
  }
  // pipeline with Sourcemap
  return combine(
    sourcemaps.init(options.sourcemaps),
    preprocessors,
    postcss(postprocessors),
    sourcemaps.write(".")
  );
};
