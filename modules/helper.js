"use strict";

module.exports = function(env, logger) {
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

  this.dereferenceArray = function(arr, callback) {
    var len = arr.length, remain = arr.length;
    for (var i = 0; i < len; i++)
      (function(index) {
        logger.debug(arr[index]);
        env.db.collection(arr[index].namespace, {
          safe : true,
          strict : true
        }, function(err, collection) {
          if (err) {
            remain = 0;
            callback(err);
            return;
          }
          logger.debug(arr[index].oid);
          collection.find({
            _id : arr[index].oid
          }).toArray(function(err, docs) {
            if (err) {
              remain = 0;
              callback(err);
              return;
            }
            logger.debug(docs);
            arr[index] = docs[0];
            remain--;
            if (remain === 0)
              callback(null);
          });
        });
      })(i);
  }
  return this;
};
