"use strict";

function Request(ws, data, db) {
  this.ws = ws;
  this.data = data;
  this.db = db;
}

function Response(ws, data) {
  this.ws = ws;
  this.data = data;
}

Response.prototype.resession = function() {
  this.ws.send(JSON.stringify({
    "type": "resession",
  }));
  this.ws.send(JSON.stringify({
    "type": this.data.type,
    "success": false,
    "reason": "Bad session"
  }));
};

Response.prototype.fail = function(reason) {
  var self = this;
  if (self.session)
    self.session.writeBack(function() {
      self.ws.send(JSON.stringify({
        "type": self.data.type,
        "success": false,
        "reason": reason
      }));
    });
  else
    self.ws.send(JSON.stringify({
      "type": self.data.type,
      "success": false,
      "reason": reason
    }));
};

Response.prototype.success = function(data) {
  var self = this;
  var res = {
    "type": this.data.type,
    "success": true
  };
  for (var i in data)
    res[i] = data[i];
  if (self.session)
    self.session.writeBack(function() {
      self.ws.send(JSON.stringify(res));
    });
  else
    self.ws.send(JSON.stringify(res));
};

module.exports.Request = Request;
module.exports.Response = Response;