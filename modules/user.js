module.exports = function(env) {
  function checkUsername(name){
    return name.length >= 6;
  }
  function checkPassword(password){
    return password.length >= 6;
  }
  function handleLogin(req, res) {
    req.db.collection('users', { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({ username: req.data.username }).toArray(function(err, docs) {
        if (docs.length == 0)
          res.fail("User does not exist");
        else if (docs[0].password != req.data.password)
          res.fail("Password is not correct");
        else {
          res.session.loginLevel = docs[0].level;
          res.session.username = docs[0].username;
          res.success({
            "username": docs[0].username,
            "loginLevel": docs[0].level
          });
        }
      });
    });
  }
  
  function handleRegister(req, res) {
    var username = req.data.username;
    var password = req.data.password;
    req.db.collection('users', { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      if (!check_username(username))
        res.fail("Username should be a string whose length is larger than 6 and consist of number and alphabets"); 
      else if (!check_password(password))
        res.fail("Password should be a string whose length is larger than 6 and consist of number and alphabets"); 
      else
        collection.count({ "username": username }, function(err, count) {
          if (err)
            throw new Error(err);
          if (count != 0)
            res.fail("Username has been taken");
          else {
            collection.insert({
              "username": username,
              "password": password,
              "level": 1
            }, {safe:true}, function(err, result) {
              if (err)
                throw new Error(err);
              res.success({
                "username": username
              });
            });
          }
        }); 
    });
  }
  
  function handleLogout(req, res) {
    if (!req.session)
      res.resession();
    res.session.username = "";
    res.session.loginLevel = 0;
    res.success();
  }
  
  env.registerHandler("login", handleLogin);
  env.registerHandler("register", handleRegister);
  env.registerHandler("logout", handleLogout);
  env.registerDefaultSession({ "username": "", "loginLevel": 0 });
}