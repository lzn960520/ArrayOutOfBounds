module.exports = function(env) {
  function handleOpenSession(req, res) {
    if (!req.session) {
      var session = env.randomMD5();
      env.initSession(session, function() {
        res.success({
          "set_session": session,
          "role": "nologin",
          "username": ""
        });
      });
    } else {
      res.success({
        "set_session": req.data.session,
        "role": req.session.role,
        "username": req.session.username
      });
    }
  }
  
  env.registerHandler("openSession", handleOpenSession);
};
