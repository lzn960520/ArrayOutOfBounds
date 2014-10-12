module.exports = function(env) {
  function handleGetModules(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
  }
}
