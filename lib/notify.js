/**
 * Notify when a error occurs and end the stream (succesful) so the watch & gulp can continue running.
 *
 * Usage:
 *   gulp.src('files.ext')
 *     .pipe(gulpPlugin())
 *     .on('error', noprotocol.notify)
 */
const gutil = require("gulp-util");
const notifier = require("node-notifier");

module.exports = function notify(err) {
  if (this.emit) {
    this.emit("end"); // @todo Not in production?
  }
  gutil.beep();
  gutil.log(err.toString());
  notifier.notify({
    title: "[noprotocol-gulp]",
    message: err.message || err,
    icon: __dirname + "/../notification.png"
  });
};
