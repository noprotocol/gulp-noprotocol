"use strict";
var gulp = require('gulp');
var assert = require('assert');
var streamAssert = require('stream-assert-gulp');
var noprocotol = require("../");
var fixtureDir = __dirname + '/fixtures/';

describe('noprocotol.js', function () {

    it('generates js and a sourcemap file', function (done) {
        gulp.src(fixtureDir + 'controller.js')
            .pipe(noprocotol.js({
                annotate: true
            }))
            .pipe(streamAssert.length(2))
            .pipe(streamAssert.first(function(file) {
                assert.equal(file.relative, 'controller.js.map');
            }))
            .pipe(streamAssert.second(function(file) {
                assert.equal(file.relative, 'controller.js');
                assert.equal(file.contents.toString(), "\"use strict\";app.controller(\"TestCtrl\",[\"$scope\",function(t){return!0}]);\n//# sourceMappingURL=controller.js.map");
            }))
            .on('end', done);
    });
});
