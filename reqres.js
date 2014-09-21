function Request(ws, data, db) {
  this.ws = ws;
  this.data = data;
  this.db = db;
}

function Response(ws, data) {
  this.ws = ws;
  this.data = data;
}

Response.prototype.fail = function(reason) {
  this.ws.send(JSON.stringify({
    "type": this.data.type,
    "success": false,
    "reason": reason
  }));
}

Response.prototype.success = function(data) {
  var res = {
    "type": this.data.type,
    "success": true
  }
  for (var i in data)
    res[i] = data[i];
  this.ws.send(JSON.stringify(res));
}

module.exports.Request = Request;
module.exports.Response = Response;