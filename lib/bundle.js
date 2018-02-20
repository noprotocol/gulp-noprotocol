/**
 * Predefined set of options for noprotocol.js()
 * Tailored towards concatting minified libs into a single file.
 */
"use strict";

const js = require("./js");

module.exports = function bundle(filename, options) {
  options = options || {};
  options.bundle = filename;
  options.babel = options.babel || false;
  options.minify = options.minify || false;
  options.sourcemaps =
    typeof options.sourcemaps === "undefined"
      ? { loadMaps: true }
      : options.sourcemaps;
  return js(options);
};
