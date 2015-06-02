"use strict";
var gulp = require('gulp');
var assert = require('assert');
var streamAssert = require('stream-assert-gulp');
var noprocotol = require("../");
var fixtureDir = __dirname + '/fixtures/';

describe('noprocotol.angular', function () {

    it('generates a js bundle and a sourcemap file', function (done) {
        gulp.src(fixtureDir + 'controller.js')
            .pipe(noprocotol.angular({
                deps: ['ngAnimate'] // Genereate an angular.module()
            }))
            .pipe(streamAssert.length(2))
            .pipe(streamAssert.first(function(file) {
                assert.equal(file.relative, 'app.min.js.map');
            }))
            .pipe(streamAssert.second(function(file) {
                assert.equal(file.relative, 'app.min.js');
                assert.equal(file.contents.toString(), "\"use strict\";var app=angular.module(\"app\",[\"ngAnimate\"]);app.controller(\"TestCtrl\",[\"$scope\",function(r){return!0}]);\n//# sourceMappingURL=app.min.js.map");
            }))
            .on('end', done);
    });

    it('places html files into the $templateCache', function (done) {
        gulp.src(fixtureDir + '**/hello.html')
            .pipe(noprocotol.angular())
            .pipe(streamAssert.length(2))
            .pipe(streamAssert.second(function(file) {
                assert.equal(file.relative, 'app.min.js');
                assert.equal(file.contents.toString(), "\"use strict\";angular.module(\"app\").run([\"$templateCache\",function(e){e.put(\"\",\"<h1>Hello</h1><p>world</p>\")}]);\n//# sourceMappingURL=app.min.js.map");
            }))
            .on('end', done);
    });
});
