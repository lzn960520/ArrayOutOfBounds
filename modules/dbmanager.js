"use strict";

module.exports = function(env, logger) {
  this.updateDb = function() {
    env.db.collection("versions", {
      safe : true,
      strict : true
    }, function(err, versions) {
      function update(name, from) {
        if (env.dbs[name].length === from) {
          env.events.emit("CollectionReady", name);
          return;
        }
        logger.info("Update " + name + " from " + from + " to " + (from + 1));
        env.dbs[name][from](function() {
          versions.update({
            "name" : name
          }, {
            "$set" : {
              "version" : from + 1
            }
          }, {
            upsert : true
          }, function(err) {
            if (err)
              logger.error(err.stack);
            update(name, from + 1);
          });
        });
      }
      function tryupdate(name) {
        versions.findOne({
          "name" : name
        }, {
          _id : 0,
          version : 1
        }, function(err, doc) {
          if (err) {
            logger.error(err.stack);
          }
          if (doc === null) {
            update(name, 0);
          } else {
            update(name, doc.version);
          }
        });
      }
      function updates() {
        var cnt = 0;
        for ( var name in env.dbs)
          cnt++;
        env.events.after("CollectionReady", cnt, function() {
          logger.info("Database ready");
          env.events.emit("DatabaseReady");
        });
        for (name in env.dbs) {
          tryupdate(name);
        }
      }
      if (err) {
        logger.info("Creating new database");
        env.db.createCollection("versions", function(err) {
          if (err) {
            throw err;
          }
          env.db.collection("versions", {
            safe : true,
            strict : true
          }, function(err, versions) {
            if (err) {
              throw err;
            }
            versions.ensureIndex({
              "name" : 1
            }, {
              unique : true
            }, function(err) {
              if (err) {
                throw err;
              }
              updates();
            });
          });
        });
      } else {
        updates();
      }
    });
  };

  env.events.emitLater("ModuleReady", "dbmanager");
};
