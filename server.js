"use strict";

// Import modules
var fs = require("fs");
var crypto = require("crypto");
var os = require("os");
var mongodb = require("mongodb");
var domain = require("domain");
var reqres = require("./reqres");

// Config log4js
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

// Prepare env
var env = {
  "registerHandler" : function(name, func) {
    if (!func || typeof func != "function")
      return;
    handles[name] = func;
  },
  "randomMD5" : function() {
    return crypto.createHash("md5").update(
        crypto.createHash("md5").update(
            ((os.uptime() + os.totalmem()) * (os.freemem() + 100007))
                .toString() +
                new Date().toISOString()).digest("hex") +
            Math.random()).digest("hex");
  },
  "initSession" : function(session, callback) {
    env.modules.session.initSession(session, callback);
  },
  "registerDefaultSession" : function(defaults) {
    env.modules.session.registerDefaultSession(defaults);
  },
  "modules" : {},
  "dbs" : {},
  "require" : function(name, callback) {
    if (typeof env.modules[name] === "undefined") {
      logger.info("Loading " + name);
      env.modules[name] = new (require("./modules/" + name + ".js"))(env,
          log4js.getLogger(name), callback);
      logger.info("Loaded " + name);
    } else if (callback)
      callback();
  },
  "publishDb" : function(name, func) {
    if (typeof env.dbs[name] === "undefined") {
      env.dbs[name] = [ func ];
    } else {
      env.dbs[name].push(func);
    }
  },
  "events" : new require("eventproxy")()
};

// Load modules
function loadModules() {
  env.require("session");
  fs.readdir("modules/", function(err, files) {
    if (err) {
      logger.error(err.stack);
      return;
    }
    var cnt = 0;
    for (var i = 0; i < files.length; i++) {
      if (files[i].slice(-3) === ".js") {
        cnt++;
      }
    }
    env.events.on("ModuleReady", function(name) {
      logger.info(name + " ready");
    });
    env.events.after("ModuleReady", cnt, function() {
      env.events.emit("ModulesReady");
    });
    for (i = 0; i < files.length; i++) {
      if (files[i].slice(-3) === ".js") {
        env.require(files[i].slice(0, files[i].length - 3));
      }
    }
    env.events.emit("ModulesLoaded");
  });
}

// Connect to database.
function connectDatabase() {
  var server = new mongodb.Server("localhost", 27017, {
    auto_reconnect : true
  });
  env.db = new mongodb.Db("outofbound", server, {
    safe : true
  });
  env.db.open(function(err) {
    if (err) {
      logger.error(err.stack);
      process.exit(-1);
    }
    logger.info("Database connected");
    env.events.emit("DatabaseConnected");
  });
}

// Update database
function updateDatabase() {
  env.modules.dbmanager.updateDb();
}

// Start up WebSocket server
function startServer() {
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
            logger.debug("Handle " + JSON.stringify(data));
            env.modules.session.getSession(data.session, function(session) {
              var req = new reqres.Request(ws, data, env.db);
              var res = new reqres.Response(ws, data);
              req.session = session;
              res.session = session;
              if (req.data.type == "openSession")
                handles[data.type](req, res);
              else if (!req.session) {
                res.resession();
              } else if (env.modules.permission.granted(req, res))
                handles[data.type](req, res);
            });
          });
        } else {
          logger.warn("Unknown message " + JSON.stringify(data));
          ws.send(JSON.stringify({
            "type" : data.type,
            "success" : false,
            "reason" : "Unknown operation"
          }));
        }
      } catch (err) {
        logger.error(err.stack);
        ws.send(JSON.stringify({
          "type" : data.type,
          "success" : false,
          "reason" : "Server crashed"
        }));
      }
    });
  }
  env.server = require("socket.io")(805);
  env.server.on("connection", onconnection);
  env.server.on("close", onclose);
  logger.info("Server ready");
}

env.events.once("Init", loadModules);
env.events.once("ModulesLoaded", connectDatabase);
env.events.once("DatabaseConnected", updateDatabase);
env.events.once("ModulesReady", startServer);
env.events.emit("Init");
