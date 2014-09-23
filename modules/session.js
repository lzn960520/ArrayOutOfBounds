module.exports = function(env) {
  function handleOpenSession(req, res) {
    if (!req.session) {
      var session = env.randomMD5();
      env.initSession(session, function() {
        res.success({
          "set_session": session,
          "loginLevel": 0,
          "username": null
        });
      });
    } else {
      res.success({
        "set_session": req.data.session,
        "loginLevel": req.session.loginLevel,
        "username": req.session.username
      });
    }
  }
  
  env.registerHandler("openSession", handleOpenSession);
};
