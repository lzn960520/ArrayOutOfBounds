"use strict";

module.exports = function() {
  var os = require("os");
  if (os.platform() == "win32") {
    this.rmdir = function(dir, callback) {
      require("child_process").exec(
          "rmdir /s /q " + dir.replace("/", "\\"),
          callback);
    };
  } else {
    this.rmdir = function(dir, callback) {
      require("child_process").exec("rm -r -f " + dir, callback);
    };
  }
  return this;
};
