Gulp NoProtocol
----------------

[![Build Status](https://travis-ci.org/noprotocol/gulp-noprotocol.png)](https://travis-ci.org/noprotocol/gulp-noprotocol)

Optimised gulp pipelines for css and javascript.


### noprotocol.css()
Create an minified, sourcemapped, autoprefixed stylesheet from sass or css files.

### noprotocol.js()
Create an minified, sourcemapped, transpiled javascript from ES5 / ES6 files.

### noprotocol.angular()
Create a minified, sourcemapped, transpiled, angular module bundle.

### noprotocol.notify
Report gulp errors as OS X notifications, and prevent gulp from crashing.

## Example gulpfile.js

```js
var gulp = require('gulp');
var noprotocol = require('gulp-noprotocol');
var livereload = require('gulp-livereload');
var server = require('gulp-develop-server');

gulp.task('css', function() {
    return gulp.src('public/sass/**/*.{scss,sass}')
        .pipe(noprotocol.css())
        .on('error', noprotocol.notify)
        .pipe(gulp.dest('public/dist'));
});

gulp.task('bundle-libs', function() {
    return gulp.src([
        'public/libs/jquery/dist/jquery.min.js',
        'public/libs/angular/angular.min.js'
        'public/libs/angular-animate/angular-animate.min.js'
    ])
    .pipe(noprotocol.bundle('libs.bundle.js'))
    .on('error', noprotocol.notify)
    .pipe(gulp.dest('public/dist'));
});

gulp.task('bundle-app', function () {
    return gulp
        .src([
            'public/js/**/*.js',
            'public/views/**/*.html', 
            'public/js/directives/**/*.html'
        ])
        .pipe(noprotocol.angular({ 
            deps: ['ngAnimate']
        }))
        .on('error', noprotocol.notify)
        .pipe(gulp.dest('public/dist'));
});
// Example node development server
gulp.task('server', function () {
    server.listen({
        path: './app/index.js'
    });
});

gulp.task('watch', ['css', 'bundle-app', 'bundle-libs', 'node-server'], function() {

    livereload.listen();
    gulp.watch('app/**/*.js', server.restart);
    gulp.watch('public/sass/**/*.{scss,sass}', ['css']);
    gulp.watch(['public/js/**/*.js', 'public/views/**/*.html'], ['bundle-app']);
    gulp.watch([
        'public/dist/*.css',
        'public/dist/*.js',
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
