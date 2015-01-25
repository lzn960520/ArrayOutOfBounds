module.exports = function(env) {
  function checkUsername(name) {
    return name.length >= 6;
  }
  function checkPassword(password) {
    return password.length >= 6;
  }
  function handleLogin(req, res) {
    req.db.collection('users', {
      safe : true,
      strict : true
    }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({
        username : req.data.username
      }).toArray(function(err, docs) {
        if (docs.length == 0)
          res.fail("User does not exist");
        else if (docs[0].password != req.data.password)
          res.fail("Password is not correct");
        else {
          res.session.role = docs[0].role;
          res.session.username = docs[0].username;
          res.success({
            "username" : docs[0].username,
            "role" : docs[0].role
          });
        }
      });
    });
  }

  function handleRegister(req, res) {
    var username = req.data.username;
    var password = req.data.password;
    req.db
        .collection(
            'users',
            {
              safe : true,
              strict : true
            },
            function(err, collection) {
              if (err)
                throw new Error(err);
              if (!checkUsername(username))
                res
                    .fail("Username should be a string whose length is larger than 6 and consist of number and alphabets");
              else if (!checkPassword(password))
                res
                    .fail("Password should be a string whose length is larger than 6 and consist of number and alphabets");
              else
                collection.count({
                  "username" : username
                }, function(err, count) {
                  if (err)
                    throw new Error(err);
                  if (count != 0)
                    res.fail("Username has been taken");
                  else {
                    collection.insert({
                      "username" : username,
                      "password" : password,
                      "role" : "user"
                    }, {
                      safe : true
                    }, function(err, result) {
                      if (err)
                        throw new Error(err);
                      res.session.role = "user";
                      res.session.username = username;
                      res.success({
                        "username" : username,
                        "role" : "user"
                      });
                    });
                  }
                });
            });
  }

  function handleLogout(req, res) {
    res.session.username = "";
    res.session.role = "nologin";
    res.success({
      "username" : "",
      "role" : "nologin"
    });
  }

  env.registerHandler("login", handleLogin);
  env.registerHandler("register", handleRegister);
  env.registerHandler("logout", handleLogout);
  env.registerDefaultSession({
    "username" : "",
    "role" : "nologin"
  });
}
