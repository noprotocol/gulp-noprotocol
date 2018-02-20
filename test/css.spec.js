"use strict";
const gulp = require("gulp");
const streamAssert = require("stream-assert-gulp");
const noprocotol = require("../");
const fixtureDir = __dirname + "/fixtures/";

describe("noprocotol.css", function() {
  it("generates css and a sourcemap file", function(done) {
    gulp
      .src(fixtureDir + "basic.scss")
      .pipe(noprocotol.css())
      .pipe(streamAssert.length(2))
      .pipe(
        streamAssert.first(function(file) {
          expect(file.relative).toBe("basic.css.map");
        })
      )
      .pipe(
        streamAssert.second(function(file) {
          expect(file.relative).toBe("basic.css");
          expect(file.contents.toString()).toMatchSnapshot();
        })
      )
      .on("end", done);
  });

  it("emits an error when encountering invalid sass", function(done) {
    gulp
      .src(fixtureDir + "broken_syntax.scss")
      .pipe(noprocotol.css())
      .on("error", function(err) {
        expect(err.plugin).toBe("gulp-sass");
        done();
      })
      .pipe(streamAssert.length(0));
  });

  it("accepts regular css", function(done) {
    gulp
      .src(fixtureDir + "noprefix.css")
      .pipe(
        noprocotol.css({
          browsers: ["ios 8"]
        })
      )
      .pipe(
        streamAssert.second(function(file) {
          expect(file.relative).toBe("noprefix.css");
          expect(file.contents.toString()).toMatchSnapshot();
        })
      )
      .pipe(streamAssert.length(2))
      .on("end", done);
  });
});
