"use strict";

function isArray(o) {
  return Object.prototype.toString.call(o) === "[object Array]";
}
module.exports = function(env, logger) {
  var fs = require("fs");
  var express = require("express");
  var bodyParser = require("body-parser");

  // Run upload server
  var webapp = express();
  webapp.use(bodyParser.urlencoded({
    extended : false
  }));
  webapp.use(require("connect-multiparty")());
  webapp.post(
      "/innovenus/OutOfBounds/master/WebContent/uploadcasefile",
      function(req, res) {
        var session = req.body.session;
        if (typeof session === "undefined" || session === null ||
            session === "null" || session === "") {
          session = env.randomMD5();
          fs.mkdirSync(__dirname + "/tmp/" + session + "/");
        }
        var files = req.files.upload;
        if (!isArray(files))
          files = [ files ];
        var processed = 0;
        files.forEach(function(file) {
          if (file.name.match(/[1-9][0-9]*.(in|out)/)) {
            fs.readFile(file.path, function(err, data) {
              if (err) {
                logger.error(err.stack);
                processed++;
                return;
              }
              file.name = file.name.match(/([1-9][0-9]*.(in|out))/)[0];
              fs.writeFile(
                  __dirname + "/tmp/" + session + "/" + file.name,
                  data,
                  function(err) {
                    if (err) {
                      logger.error(err.stack);
                      processed++;
                      return;
                    }
                    processed++;
                    if (processed == files.length)
                      env.modules.problem.findMissingCaseFile(
                          session,
                          Number(req.body.max_case),
                          function(missing) {
                            res.end(JSON.stringify({
                              "missing" : missing,
                              "session" : session
                            }));
                          });
                  });
              fs.unlink(file.path);
            });
          } else {
            fs.unlink(file.path);
            processed++;
            if (processed == files.length)
              env.modules.problem.findMissingCaseFile(
                  session,
                  Number(req.body.max_case),
                  function(missing) {
                    res.end(JSON.stringify({
                      "missing" : missing,
                      "session" : session
                    }));
                  });
          }
        });
      });
  env.uploadapp = webapp;
  var server = webapp.listen(8000, function() {
    logger.info("Upload server ready");
  });
  env.uploadserver = server;
};
