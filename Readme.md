Gulp NoProtocol
----------------

[![Build Status](https://travis-ci.org/noprotocol/gulp-noprotocol.svg)](https://travis-ci.org/noprotocol/gulp-noprotocol)

Optimised gulp pipelines for css and javascript.

## Installation

```sh
npm install gulp --save
npm install gulp-noprotocol --save
npm install gulp-livereload --save
```

## Usage

The noprotocol.*() streams use multiple preconfigured gulp plugins, which can be toggled by setting the option to `false`.
For example `noprotocol.css({minify: false});` disables the minification step, but will still compile sass & run the autoprefixer.  

### noprotocol.css(options)
Create an minified, sourcemapped, autoprefixed stylesheet from sass or css files.

**Options**

* autoprefixer: Options for autoprefixer (default: {browsers: ['Last 2 versions', 'IE >= 9']})
* minify: {Bool} Enables csswring (default: true)
* sass: Options for gulp-sass (defaults: {outputStyle: "compressed"})
* sourcemaps: Options for gulp-sourcemaps.init  (default: {})

### noprotocol.js(options)
Create an minified, sourcemapped, transpiled javascript from ES5 / ES6 files.

**Options**

* annotate: Options for gulp-ng-annotate (default: false)
* babel: Options for gulp-babel (default: {presets: ['es2015', 'react']})
* bundle: {String} Concat the files into one file. (default: false) 
* minify: Options for gulp-uglify (default: {})
* sourcemaps: Options for gulp-sourcemaps.init  (default: {})  

### noprotocol.bundle(filename, options)
Similar to gulp-concat but with sourcemaps enabled.

**Options**

* sourcemaps: Options for gulp-sourcemaps.init  (default: {})

### noprotocol.angular(options)
Create a minified, sourcemapped, transpiled, angular module bundle.

### noprotocol.notify
Report gulp errors as OS X notifications, and prevent gulp from crashing.

## Example gulpfile.js

```js
var gulp = require('gulp');
var noprotocol = require('gulp-noprotocol');
var livereload = require('gulp-livereload');

gulp.task('css', function() {
    return gulp.src('public/sass/**/*.{scss,sass}')
        .pipe(noprotocol.css())
        .on('error', noprotocol.notify)
        .pipe(gulp.dest('public/build'));
});

gulp.task('bundle-libs', function() {
    return gulp.src([
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/angular/angular.min.js',
        'node_modules/angular-animate/angular-animate.min.js'
    ])
    .pipe(noprotocol.bundle('libs.bundle.js'))
    .on('error', noprotocol.notify)
    .pipe(gulp.dest('public/build'));
});

gulp.task('bundle-app', function () {
    return gulp
        .src([
            'public/js/**/*.js',
            'public/views/**/*.html'
        ])
        .pipe(noprotocol.angular({
            deps: ['ngAnimate']
        }))
        .on('error', noprotocol.notify)
        .pipe(gulp.dest('public/build'));
});

gulp.task('watch', ['css', 'bundle-app', 'bundle-libs'], function() {

    livereload.listen();
    gulp.watch('public/sass/**/*.{scss,sass}', ['css']);
    gulp.watch(['public/js/**/*.js', 'public/views/**/*.html'], ['bundle-app']);
    gulp.watch([
        'public/build/*.{css,js}',
        'app/views/**/*.blade.php'
    ]).on('change', livereload.changed);
    gulp.watch(['gulpfile.js'], function () {
        noprotocol.notify('Stopping `gulp watch`, gulpfile.js was changed');
        process.exit();
    });
});

gulp.task('deploy', ['css', 'bundle-libs', 'bundle-app']);

gulp.task('default', ['watch']);
```
