/**
 * noprotocol.js() 
 * 
 * Input: clean ES6 js
 * Output: Bundled, ES5 compatible, minified, sourcemapped js file.
 *
 * Usage: 
 * gulp.src('./js/*.js')
 *   .pipe(noprotocol.js())
 *   .on('error', noprotocol.notify)
 *   .pipe(gulp.dest('./dest'));
 */
"use strict";

var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var combine = require('stream-combiner2').obj;
var ngAnnotate = require('gulp-ng-annotate');
var concat = require('gulp-concat');

/**
 * Gulp stream that outputs js.
 *
 * - babel
 * - annotate
 * - uglify
 *
 * @param {Object} options {
 *   minify: {*} (default: {}})
 *   annotate: {*} (default: false)
 *   sourcemaps: {*} (default: {})
 *   bundle: {String} filename (default: false)
 * }
 */
module.exports = function js(options) {
	options = options || {};
    options.minify = (typeof options.minify === 'undefined') ? {} : options.minify;
    options.babel = (typeof options.babel === 'undefined') ? {
        presets: ['es2015', 'react']
    } : options.babel;
    options.sourcemaps = (typeof options.sourcemaps === 'undefined') ? {} : options.sourcemaps;
    options.annotate = options.annotate || false;
    options.bundle = options.bundle || false;
    var pipeline = [];
    if (options.sourcemaps) {
        pipeline.push(sourcemaps.init(options.sourcemaps));
    }
    if (options.babel) { 
        pipeline.push(babel(options.babel));
    }
    if (options.bundle) {
        pipeline.push(concat(options.bundle));
    }
    if (options.annotate) {
    	pipeline.push(ngAnnotate(options.annotate));
    }
    if (options.minify) {
        pipeline.push(uglify(options.minify));
    }
    if (options.sourcemaps) {
        pipeline.push(sourcemaps.write('.'));
    }
	return combine(pipeline);
}
