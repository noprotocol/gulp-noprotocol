/**
 * noprotocol.angular() 
 * 
 * Input: multiple script files
 * Output: Bundled, ES5 compatible, minified, sourcemapped js file.
 *
 * Usage: 
 * gulp.src('./js/*.js')
 *   .pipe(noprotocol.angular({
 *     deps: ['ngAnimate']
 *   }))
 *   .pipe(noprotocol.notify())
 *   .pipe(gulp.dest('./dest'));
 */
"use strict";
var js = require('./js');
var path = require('path');
var File = require('vinyl');
var Buffer = require('buffer').Buffer
var templateCache = require('gulp-templatecache');
var es = require('event-stream');

module.exports = function angular(options) {
    options = options || {};
    options.minify = (typeof options.minify === 'undefined') ? true : options.minify;
    options.module = options.module || 'app';
    options.bundle = options.bundle || options.module + '.min.js';
    
    options.templateCache = options.templateCache || {};
    options.templateCache.output = options.templateCache.output || '__generated__/templateCache.js';
    options.templateCache.moduleName = options.templateCache.moduleName || options.module;
    options.templateCache.strip = options.templateCache.strip || 'public';
    if (options.minify) {
        options.templateCache.minify = {
            collapseWhitespace: true,
            conservativeCollapse: true
        };
    }
    options.annotate = true;

    var jsStream = js(options);
    if (options.deps) {
        jsStream.write(new File({
            path: '__generated__/' + options.module + '.js',
            contents: new Buffer("var " + options.module + " = angular.module('" + options.module + "'," + JSON.stringify(options.deps) + ");")
        }));
    }
    var tplStream = templateCache(options.templateCache);
    tplStream.pipe(jsStream);
    // Split of the html files
    var inputStream = es.map(function (file, callback) {
        switch(path.extname(file.path)) {
            case '.js':
                callback(null, file);
                return;
            case '.htm':
            case '.html':
                tplStream.write(file);
                callback();
                return;
            default:
                callback(new Error('Unexpected extension, expecting "*.js" or "*.html" but got "' + data.path + '"'));
                return;
        }
    });
    inputStream.pipe(jsStream, {end: false});
    inputStream.on('end', function () {
        tplStream.end();
    });
    return es.duplex(inputStream, jsStream);
}