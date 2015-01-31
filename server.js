"use strict";

// Import modules
var fs = require("fs");
var crypto = require("crypto");
var os = require("os");
var mongodb = require("mongodb");
var domain = require("domain");
var reqres = require("./reqres");
var sessionStore = require("./session.js");
var permissionManager = require("./permission.js");
var log4js = require("log4js");
log4js.configure({
  appenders : [ {
    type : "console"
  }, {
    type : "dateFile",
    filename : "server",
    pattern : "_yyyy_MM_dd.log",
    alwaysIncludePattern : true,
    maxLogSize : 4 * 1000 * 1000 * 1000,
    backups : 5
  } ],
  "levels" : {
    "[all]" : "DEBUG"
  },
  replaceConsole : true
});
var logger = log4js.getLogger("server");

// Handler table
var handles = {};

// Connect to database.
var server = new mongodb.Server("localhost", 27017, {
  auto_reconnect : true
});
var db = new mongodb.Db("outofbound", server, {
  safe : true
});
db
    .open(function(err, db) {
      if (err) {
        logger.error(err.stack);
        return;
      }
      logger.info("Database ready");
      sessionStore = new sessionStore(db, "session",
          function() {
            logger.info("Session storage ready");
            permissionManager = new permissionManager(log4js
                .getLogger("permMan"),
                function() {
                  logger.info("Permission manager ready");
                  // Environment for modules
                  var env = {
                    "registerHandler" : function(name, func) {
                      if (!func || typeof func != "function")
                        return;
                      handles[name] = func;
                    },
                    "randomMD5" : function() {
                      return crypto.createHash("md5").update(
                          crypto.createHash("md5")
                              .update(
                                  ((os.uptime() + os.totalmem()) * (os
                                      .freemem() + 100007)).toString() +
                                      new Date().toISOString()).digest("hex") +
                              Math.random()).digest("hex");
                    },
                    "initSession" : function(session, callback) {
                      sessionStore.initSession(session, callback);
                    },
                    "registerDefaultSession" : function(defaults) {
                      sessionStore.registerDefaultSession(defaults);
                    },
                    modules : {}
                  };

                  // Load modules
                  fs
                      .readdir(
                          "modules/",
                          function(err, files) {
                            if (err) {
                              logger.error(err.stack);
                              return;
                            }
                            for (var i = 0; i < files.length; i++)
                              if (files[i].slice(-3) == ".js") {
                                logger.info("Loading " +
                                    files[i].slice(0, files[i].length - 3));
                                env.modules[files[i].slice(
                                    0,
                                    files[i].length - 3)] = new (require(
                                    "./modules/" + files[i]))(
                                    env,
                                    log4js.getLogger(files[i].slice(
                                        0,
                                        files[i].length - 3)));
                                logger.info("Loaded " +
                                    files[i].slice(0, files[i].length - 3));
                              }

                            // Start web socket server
                            function onclose() {}
                            function onconnection(ws) {
                              ws.on("message", function(raw) {
                                try {
                                  var data = JSON.parse(raw.substr(32));
                                  data.session = raw.substr(0, 32);
                                  if (handles[data.type]) {
                                    var d = domain.create();
                                    d.on("error", function(err) {
                                      logger.error(err.stack);
                                      ws.send(JSON.stringify({
                                        "type" : data.type,
                                        "success" : false,
                                        "reason" : "Server crashed"
                                      }));
                                    });
                                    d.run(function() {
                                      logger.debug("Handle " +
                                          JSON.stringify(data));
                                      sessionStore.getSession(
                                          data.session,
                                          function(session) {
                                            var req = new reqres.Request(ws,
                                                data, db);
                                            var res = new reqres.Response(ws,
                                                data);
                                            req.session = session;
                                            res.session = session;
                                            if (req.data.type == "openSession")
                                              handles[data.type](req, res);
                                            else if (!req.session) {
                                              res.resession();
                                            } else if (permissionManager
                                                .granted(req, res))
                                              handles[data.type](req, res);
                                          });
                                    });
                                  } else
                                    logger.warn("Unknown message " +
                                        JSON.stringify(data));
                                } catch (err) {
                                  logger.error(err.stack);
                                }
                              });
                            }
                            var SocketIOServer = require("socket.io")(8005);
                            SocketIOServer.on("connection", onconnection);
                            SocketIOServer.on("close", onclose);
                            logger.info("Server ready");
                          });
                });
          });
    });
