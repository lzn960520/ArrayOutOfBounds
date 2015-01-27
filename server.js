// Import modules
var fs = require('fs');
var net = require('net');
var crypto = require('crypto');
var os = require('os');
var mongodb = require('mongodb');
var domain = require('domain');
var reqres = require('./reqres');
var sessionStore = require("./session.js");
var permissionManager = require("./permission.js");

// Handler table
var handles = {}

// Connect to database.
var server = new mongodb.Server('localhost', 27017, {
  auto_reconnect : true
});
var db = new mongodb.Db('outofbound', server, {
  safe : true
});
db.open(function(err, db) {
  if (err) {
    console.log(err.stack);
    process.exit(-1);
  }
  sessionStore = new sessionStore(db, "session", function() {
    permissionManager = new permissionManager(function() {
      // Environment for modules
      var env = {
        "registerHandler" : function(name, func) {
          if (!func || typeof func != "function")
            return;
          handles[name] = func;
        },
        "randomMD5" : function() {
          return crypto.createHash('md5').update(
              crypto.createHash('md5').update(
                  ((os.uptime() + os.totalmem()) * (os.freemem() + 100007))
                      .toString() +
                      (new Date().toISOString())).digest('hex') +
                  Math.random()).digest('hex');
        },
        "initSession" : function(session, callback) {
          sessionStore.initSession(session, callback);
        },
        "registerDefaultSession" : function(defaults) {
          sessionStore.registerDefaultSession(defaults);
        },
        modules : {}
      }

      // Load modules
      fs.readdir("modules/", function(err, files) {
        if (err) {
          console.log(err);
          return;
        }
        for (var i = 0; i < files.length; i++)
          if (files[i].slice(-3) == '.js')
            env.modules[files[i].slice(0, files[i].length - 3)] = require(
                "./modules/" + files[i])(env);

        // Start web socket server
        function onclose() {
          console.log("Web socket server closed!");
        }
        function onconnection(ws) {
          ws.on('message', function(raw) {
            try {
              data = JSON.parse(raw.substr(32));
              data.session = raw.substr(0, 32);
              if (handles[data.type]) {
                var d = domain.create();
                d.on('error', function(err) {
                  console.log(err.stack);
                  ws.send(JSON.stringify({
                    "type" : data.type,
                    "success" : false,
                    "reason" : "Server crashed"
                  }));
                  d.dispose();
                });
                d.run(function() {
                  console.log("Handle " + JSON.stringify(data));
                  sessionStore.getSession(data.session, function(session) {
                    var req = new reqres.Request(ws, data, db);
                    var res = new reqres.Response(ws, data)
                    req.session = session;
                    res.session = session;
                    if (req.data.type == "openSession")
                      handles[data.type](req, res);
                    else if (!req.session) {
                      res.resession();
                    } else if (permissionManager.granted(req, res))
                      handles[data.type](req, res);
                  });
                });
              } else
                console.log("Unknown message " + JSON.stringify(data));
            } catch (err) {
              console.log(err.stack);
            }
          });
        }
        var SocketIOServer = require('socket.io')(8005);
        SocketIOServer.on('connection', onconnection);
        SocketIOServer.on('close', onclose);
      })
    });
  });
});
