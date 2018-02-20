"use strict";
var gulp = require("gulp");
var streamAssert = require("stream-assert-gulp");
var noprocotol = require("../");
var fixtureDir = __dirname + "/fixtures/";

describe("noprocotol.js", function() {
  it("generates js and a sourcemap file", function(done) {
    gulp
      .src(fixtureDir + "controller.js")
      .pipe(
        noprocotol.js({
          annotate: true
        })
      )
      .pipe(streamAssert.length(2))
      .pipe(
        streamAssert.first(function(file) {
          expect(file.relative).toBe("controller.js.map");
        })
      )
      .pipe(
        streamAssert.second(function(file) {
          expect(file.relative).toBe("controller.js");
          expect(file.contents.toString()).toMatchSnapshot();
        })
      )
      .on("end", done);
  });
});
