/**
 * noprotocol.css() 
 * 
 * Input: clean sass or css 
 * Output: compact, prefixed, souremapped css file.
 *
 * Usage: 
 * gulp.src('./sass/*.scss')
 *   .pipe(noprotocol.css());
 *   .pipe(gulp.dest('./dest'));
 */
 "use strict";

var sass = require('gulp-sass');
var es = require('event-stream');
var path = require('path');
var combine = require('stream-combiner2').obj;
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var mqpacker = require('css-mqpacker');
var csswring = require('csswring');

// constants
var NoProtocolBrowserSupport = ['Last 2 versions', 'IE >= 9'];
/**
 * Gulp stream that outputs css.
 *
 * - sass
 * - autoprefixer 
 * - mqpacker
 * - csswring
 *
 * @param {Object} options {
 *   minify: Boolean (default: true)
 *   browsers: Array (default: NoProtocolBrowserSupport)
 * }
 *  
 */
module.exports = function css(options) {
    // Configuration
    options = options || {};
    options.minify = (typeof options.minify === 'undefined') ? true : options.minify;
    options.autoprefixer = options.autoprefixer || {};
    options.autoprefixer.browsers = options.autoprefixer.browsers || options.browsers || NoProtocolBrowserSupport;

    options.sass = options.sass || {};
    if (options.minify) {
        options.sass.outputStyle = options.sass.outputStyle || 'compressed';
    }
    //
    // Preprocessor(s)
    //
    var sassStream = sass(options.sass);
    var cssStream = es.map(function filter(file, callback) {
        switch (path.extname(file.path)) {
            case '.css':
                sassStream.emit('data', file);
                callback();
                return;
            case '.scss':
            case '.sass':
                sassStream.write(file);
                callback();
                return 
            default:
                callback(new Error('No preprocessor configured for "' + path.extname(file.path) + '"'));
                return ;
        }
    });
    cssStream.on('end', function () {
        sassStream.end();
    });
    var preprocessors = es.duplex(cssStream, sassStream);
    //
    // Postprocessors
    //
    var postprocessors = [
        autoprefixer(options.autoprefixer),
    ];
    if (options.minify) {
        postprocessors.push(mqpacker, csswring);
    }
    // pipeline with Sourcemap
    return combine(
        sourcemaps.init(),
        preprocessors,
        postcss(postprocessors),
        sourcemaps.write('.')
    );
};

