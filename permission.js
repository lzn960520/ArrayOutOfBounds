var permissionManager = function(callback) {
  var self = this;
  this.roles = {};
  var fs = require("fs");
  fs.readdir("roles/", function(err, files) {
    if (err) {
      console.log(err);
      return;
    }
    for (var i = 0; i < files.length; i++)
      self.roles[files[i].substr(0, files[i].length - 3)] =
        new (require("./roles/" + files[i]));
    callback();
  });
}

permissionManager.prototype.granted = function(req, res) {
  if (!req.session.role || !this.roles[req.session.role])
    res.fail("Unknown role " + req.session.role);
  else if (!this.roles[req.session.role].granted(req, res))
    res.fail("Access denied");
  else
    return true;
}
  
module.exports = permissionManager;
