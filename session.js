var sessionStore = function(db, collName, callback) {
  var self = this;
  this.defaultSession = {};
  db.collection(collName || "session", {
    safe : true,
    strict : true
  }, function(err, collection) {
    if (err)
      throw new Error(err);
    self.collection = collection;
    callback();
  });
}
sessionStore.prototype.registerDefaultSession = function(defaults) {
  for (i in defaults)
    this.defaultSession[i] = defaults[i];
}
sessionStore.prototype.initSession = function(session, callback) {
  this.collection.insert({
    "id" : session,
    "value" : this.defaultSession,
    "lastDate" : new Date()
  }, function(err) {
    if (err)
      throw new Error(err);
    callback();
  });
}
sessionStore.prototype.getSession = function(session, callback) {
  var self = this;
  if (!session)
    callback(null);
  else
    this.collection.find({
      "id" : session
    }).toArray(function(err, docs) {
      if (err)
        throw new Error(err);
      if (docs.length == 0)
        callback(null);
      else {
        var sessionObj = docs[0]["value"];
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
        }
        callback(docs[0].value);
      }
    });
}
module.exports = sessionStore;
