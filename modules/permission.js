"use strict";

module.exports = function(env) {
  var self = this;
  this.roles = {};
  var fs = require("fs");
  fs
      .readdir(
          __dirname + "/roles/",
          function(err, files) {
            if (err) {
              throw new Error(err);
            }
            for (var i = 0; i < files.length; i++)
              self.roles[files[i].substr(0, files[i].length - 3)] = new (require("./roles/" +
                  files[i]))();
            env.events.emit("ModuleReady", "permission");
          });
  this.granted = function(req, res) {
    if (!req.session.role || !this.roles[req.session.role])
      res.fail("Unknown role " + req.session.role);
    else if (!this.roles[req.session.role].granted(req, res))
      res.fail("Permission denied");
    else
      return true;
  };
};
