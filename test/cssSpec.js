"use strict";
var gulp = require('gulp');
var assert = require('assert');
var streamAssert = require('stream-assert-gulp');
var noprocotol = require("../");
var fixtureDir = __dirname + '/fixtures/';

describe('noprocotol.css', function () {

    it('generates css and a sourcemap file', function (done) {
        gulp.src(fixtureDir + 'basic.scss')
            .pipe(noprocotol.css())
            .pipe(streamAssert.length(2))
            .pipe(streamAssert.first(function(file) {
                assert.equal(file.relative, 'basic.css.map');
            }))
            .pipe(streamAssert.second(function(file) {
                assert.equal(file.relative, 'basic.css');
                assert.equal(file.contents.toString(), "body{color:#00f}\n/*# sourceMappingURL=basic.css.map */\n");
            }))
            .on('end', done);
    });

    it('emits an error when encountering invalid sass', function (done) {
        gulp.src(fixtureDir + 'broken_syntax.scss')
            .pipe(noprocotol.css())
            .on('error',  function (err) {
                assert.equal(err.plugin, 'gulp-sass');
                done();
            }).pipe(streamAssert.length(0));
    });

    it('accepts regular css', function (done) {
        gulp.src(fixtureDir + 'noprefix.css')
            .pipe(noprocotol.css({
                browsers: ['ios 8']
            }))
            .pipe(streamAssert.second(function(file) {
                assert.equal(file.relative, 'noprefix.css');
                assert.equal(file.contents.toString(), "button:hover{-webkit-transform:scale(1.1);transform:scale(1.1)}\n/*# sourceMappingURL=noprefix.css.map */\n");
            }))
            .pipe(streamAssert.length(2))
            .on('end', done);
    });
});
