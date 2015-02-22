"use strict";

module.exports = function(env) {
  var self = this;
  this.defaultSession = {};
  self.collection = null;
  env.events.on("DatabaseReady", function() {
    env.db.collection("session", {
      safe : true,
      strict : true
    }, function(err, collection) {
      self.collection = collection;
      env.events.emit("ModuleReady", "session");
    });
  });
  this.registerDefaultSession = function(defaults) {
    for ( var i in defaults)
      this.defaultSession[i] = defaults[i];
  };
  this.initSession = function(session, callback) {
    self.collection.insert({
      "id" : session,
      "value" : self.defaultSession,
      "lastDate" : new Date()
    }, function(err) {
      if (err)
        throw new Error(err);
      callback();
    });
  };
  this.getSession = function(session, callback) {
    if (!session)
      callback(null);
    else
      self.collection.find({
        "id" : session
      }).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        if (docs.length === 0)
          callback(null);
        else {
          var sessionObj = docs[0].value;
          sessionObj.writeBack = function(callback) {
            self.collection.update({
              "id" : session
            }, {
              $set : {
                "value" : sessionObj,
                "lastDate" : new Date()
              }
            }, {
              safe : true
            }, function(err) {
              if (err)
                throw new Error(err);
              callback();
            });
          };
          callback(docs[0].value);
        }
      });
  };
  function handleOpenSession(req, res) {
    if (!req.session) {
      var session = env.randomMD5();
      env.initSession(session, function() {
        res.success({
          "set_session" : session,
          "role" : "nologin",
          "username" : ""
        });
      });
    } else {
      res.success({
        "set_session" : req.data.session,
        "role" : req.session.role,
        "username" : req.session.username
      });
    }
  }

  env.registerHandler("openSession", handleOpenSession);
  env.publishDb("session", function(callback) {
    env.db.createCollection("session", function(err) {
      if (err)
        throw new Error(err);
      env.db.collection("session", {
        safe : true,
        strict : true
      }, function(err, collection) {
        if (err)
          throw new Error(err);
        collection.ensureIndex({
          lastDate : 1
        }, {
          expiredAfterSeconds : 600
        }, function(err) {
          if (err)
            throw new Error(err);
          if (callback)
            callback();
        });
      });
    });
  });
};
