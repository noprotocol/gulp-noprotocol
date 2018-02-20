const gulp = require("gulp");
const streamAssert = require("stream-assert-gulp");
const noprocotol = require("../");
const fixtureDir = __dirname + "/fixtures/";

describe("noprocotol.angular", function() {
  it("generates a js bundle and a sourcemap file", function(done) {
    gulp
      .src(fixtureDir + "controller.js")
      .pipe(
        noprocotol.angular({
          deps: ["ngAnimate"] // Genereate an angular.module()
        })
      )
      .pipe(streamAssert.length(2))
      .pipe(
        streamAssert.first(function(file) {
          expect(file.relative).toBe("app.min.js.map");
        })
      )
      .pipe(
        streamAssert.second(function(file) {
          expect(file.relative).toBe("app.min.js");

          expect(file.contents.toString()).toMatchSnapshot();
        })
      )
      .on("end", done);
  });

  it("places html files into the $templateCache", function(done) {
    gulp
      .src(fixtureDir + "**/hello.html")
      .pipe(noprocotol.angular())
      .pipe(streamAssert.length(2))
      .pipe(
        streamAssert.second(function(file) {
          expect(file.relative).toBe("app.min.js");
          expect(file.contents.toString()).toMatchSnapshot();
        })
      )
      .on("end", done);
  });
});
