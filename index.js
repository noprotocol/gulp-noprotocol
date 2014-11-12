'use strict';

// node
var Buffer = require('buffer').Buffer;
var path = require('path');
// npm
var es = require('event-stream');
var clone = require('gulp-clone');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var please = require('gulp-pleeease');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var templateCache = require('gulp-templatecache');
var traceur = require('gulp-traceur');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var noprotocol = module.exports = {
    /**
     * Expose gulp plugins
     */
    plugins: {
        eventStream: es,
        clone: clone,
        concat: concat,
        ngAnnotate: ngAnnotate,
        please: please,
        rename: rename,
        sass: sass,
        sourcemaps: sourcemaps,
        templateCache: templateCache,
        traceur: traceur,
        uglify: uglify,
        gutil: gutil
    },
    /**
     * A gulp-sass stream with improved defaults.
     * external sourcemap + pleeease (autoprefix, mqpacker, etc)
     *
     * @param {Object} [options] {}
     * @returns {Stream}
     */
    sass: function (options) {
        var options = options || {};
        if (typeof options.sourceComments === 'undefined') {
            options.sourceComments = 'map';
        }
        options.onError = function (err) {
            gutil.beep();
            gutil.log(gutil.colors.red('[gulp-sass] ' + err));
        };
        options.please = options.please || {
            autoprefixer: {
                browsers: ['last 2 versions', 'ie >= 9']
            }
        };
        var sassSteam = sass(options);
        var pleaseStream = please(options.please);

        if (!options.sourceComments || options.sourceComments !== 'map') { // No sourcemap?
            sassSteam.pipe(pleaseStream);
            return es.duplex(sassSteam, pleaseStream);
        }
        // gulp-sourcemap doesn't work as advertised, jumping through hoops here to get it working properly
        var inputStream = this.withSourcemap(sassSteam, null, null);
        var outputStream = this.withSourcemap(pleaseStream, null, null);
        inputStream.pipe(outputStream);
        var combinedStream = es.duplex(inputStream, outputStream);
        var externalSourcemapStream = this.externalSourcemap();
        combinedStream.pipe(externalSourcemapStream);
        return es.duplex(combinedStream, externalSourcemapStream);
    },
    /**
     * Wrap a stream with sourcemaps init / write streams.
     * @link https://github.com/floridoo/gulp-sourcemaps
     *
     * @param {Stream} stream
     * @param {Object} [initOptions]
     * @param {String} [output] folder for the sourcemap
     * @param {Object} [writeOptions]
     * @returns {Stream}
     */
    withSourcemap: function (stream, initOptions, output, writeOptions) {
        initOptions = initOptions || { loadMaps: true, debug: true };
        writeOptions = writeOptions || { debug: true };
        if (typeof output === 'undefined') {
            output = './';
        }
        var inputStream = sourcemaps.init(initOptions);
        var outputStream = sourcemaps.write(output, writeOptions);
        inputStream
            .pipe(stream)
            .pipe(outputStream);
        return es.duplex(inputStream, outputStream);
    },
    /**
     * A stream that extract an inline sourcemap and puts it into an external .map file.
     *
     * @returns {Stream}
     */
    externalSourcemap: function () {
        var stream = es.map(function (file, callback) {
            var contents = file.contents.toString('utf8');
            var pos = contents.indexOf('/*# sourceMappingURL=data:application/json;base64,');
            file.contents = new Buffer(contents.slice(0, pos) + '\n/*# sourceMappingURL=' + path.basename(file.path) + '.map */');
            callback(null, file);
            stream.emit('data', new gutil.File({
                cwd: file.cwd,
                base: file.base,
                path: file.path + '.map',
                contents: new Buffer(contents.slice(pos + 50, -2), 'base64')
            }));
        });
        return stream;
    },
    /**
     * Example: gulp.watch('gulpfile.js', noprotocol.exit('gulpfile.js has changed'));
     *
     * @param {String} message
     */
    exit: function (message) {
        return function () {
            gutil.beep();
            gutil.log(message);
            process.exit();
        };
    },
    /**
     * Build an optimized angular module.
     *
     * templateCache & traceur -> ngAnnotate -> concat -> uglify
     *
     * @param {Object}
     *   module: Name of the angular module
     *   deps: Dependancies for the angular.module("app") (When ommited, no angular.module() is generated)
     *   output:  Filename for the generated output.
     * @returns {Stream}
     */
    angular: function (options) {
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
    /**
     *
     * @param {String} output  The name of the concatenated output file.
     * @param {String} [module]  The name of the module (When set, a angular.module declaration file is generated)
     * @param {String} [deps]
     * @returns {unresolved}
     */
    _angularModule: function (output, module, deps) {
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
        annotateStream.on('error', function (e) {
            gutil.log(gutil.colors.red(e.message));
            var file = new gutil.File({
                path: '__generated__/gulpfile.js',
                contents: new Buffer("console.error('[gulp]', " + JSON.stringify(e.message) + ");")
            });
            annotateStream.end(file);
        });

        var cloneSink = clone.sink();
        var concatStream = inputStream
            .pipe(this.traceur())
            .pipe(annotateStream)
            .pipe(concat(output));

        if (output.substr(output.length - 4) === '.min') {
            concatStream
                .pipe(cloneSink)
                .pipe(rename(function (path) {
                    path.basename += ".min";
                }))
                .pipe(uglify())
                .pipe(cloneSink.tap())
                .pipe(outputStream);
        } else {
            concatStream
                .pipe(uglify())
                .pipe(outputStream);
        }



        return es.duplex(inputStream, outputStream);
    },
    /**
     * @returns {Stream}
     */
    traceur: function (options) {
        var stream = traceur(options);
        stream.on('error', function (e) {
            gutil.log('[gulp-traceur]', gutil.colors.red(e.message));
            gutil.beep();
        });
        return stream;
    },
    /**
     * Concat javascript files and generate a sourcemap.
     *
     * @param {String} The filename for the combined output
     * @param {Object} options { uglify: boolean }
     *
     * @returns {Stream}
     */
    concat: function (filename, options) {
        var options = options || {};
        var input = sourcemaps.init({loadMaps: true});
        var output = sourcemaps.write('./');

        var stream = input.pipe(concat(filename));
        if (options.uglify) {
            stream.pipe(uglify()).pipe(output);
        } else {
            stream.pipe(output);
        }
        return es.duplex(input, output);
    }
};
