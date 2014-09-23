module.exports = function(env) {
  var net = require('net');
  var exec = require("child_process").exec;
  function findMissingCasefile(dir, max_case, callback) {
    if (!callback)
      return;
    fs.readdir("tmp/" + dir, function(err, files) {
      if (err) {
        console.log(err.stack);
        callback(['all']);
        return;
      }
      files = files.join('\n');
      var ans = [];
      for (var i = 1; i <= max_case; i++) {
        if (!files.match(i+'.in'))
          ans.push(i+'.in');
        if (!files.match(i+'.out'))
          ans.push(i+'.out');
      }
      callback(ans);
    })
  }
  
  function handleGetProblem(req, res) {
    req.db.collection("problems", { safe: true, strict: true }, function(err, collection){
      if (err)
        throw new Error(err);
      collection.find({ pid:parseInt(req.data.pid) }).toArray(function(err, docs){
        if (err)
          throw new Error(err);
        var thisproblem = docs[0];
        res.success({
          "name": thisproblem.name,
          "pid": thisproblem.pid,
          "description": thisproblem.description,
          "input": thisproblem.input,
          "output": thisproblem.output,
          "num_case": thisproblem.num_case,
          "problem_type": thisproblem.type
        });               
      });
    });
  }
  
  function handleGetProblems(req, res) {
    req.db.collection("problems", { safe: true, strict: true }, function(err, collection){
      if (err)
        throw new Error(err);
      collection.find({}).toArray(function(err, docs){
        if (err)
          throw new Error(err);
        var len = docs.length;
        var name = new Array(len);
        var pid = new Array(len);
        for (var i = 0; i < len; i++) {
          name[i] = docs[i].name;
          pid[i] = docs[i].pid;
        }
        res.success({
          "name": name,
          "pid": pid,
          "length": name.length
        });               
      });
    });
  }
  
  function handleAddProblem(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
    if (req.session.loginLevel == 0) {
      res.fail("You need login first");
      return;
    }
    if (req.session.loginLevel == 1) {
      res.fail("You don't have privilege to add problem");
      return;
    }
    if (!req.data.upload_session)
      res.fail("Bad session");
    else {
      var session = req.data.upload_session;
      find_missing_casefile(session, req.data.num_case, function(missing) {
        if (missing.length != 0) {
          res.fail("Missing test case " + missing);
          exec("rm -r -f tmp/" + session, function(err) {
            if (err)
              throw new Error(err);
          });
        } else {
          req.db.collection('problems', { safe: true, strict: true }, function(err, collection) {             
            if (err) {
              exec("rm -r -f tmp/" + session, function(err) {
                if (err)
                  throw new Error(err);
              });
              throw new Error(err);
            }
            collection.count({}, function(err, count){
              if (err) {
                exec("rm -r -f tmp/" + session, function(err) {
                  if (err)
                    throw new Error(err);
                });
                throw new Error(err);
              }
              var newpid = count + 1;
              fs.rename("tmp/" + session, "problem/" + newpid, function(err) {
                if (err) {
                  exec("rm -r -f tmp/" + session, function(err) {
                    if (err)
                      throw new Error(err);
                  });
                  throw new Error(err);
                }
                collection.insert(
                  {
                    "name": req.data.name,
                    "description": req.data.description,
                    "input": req.data.input,
                    "output": req.data.output,
                    "pid": req.newpid,
                    "num_case": req.data.num_case,
                    "type": req.data.type
                  }, { safe: true }, function(err, result) {
                    if (err) {
                      exec("rm -r -f problem/" + newpid, function(err) {
                        if (err)
                          throw new Error(err);
                      });
                      throw new Error(err);
                    } else
                      res.success();
                  }
                );
              });
            });
          });
        }
      });
    }
  }
  
  function handleEditProblem(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
    if (req.session.loginLevel == 0) {
      res.fail("You need login first");
      return;
    }
    if (req.session.loginLevel == 1) {
      res.fail("You don't have privilege to edit problem");
      return;
    }
    var session = req.data.upload_session;
    if (!session) {
      req.db.collection("problems", { safe: true, strict: true }, function(err, collection) {
        if (err)
          throw new Error(err);
        collection.update(
          { "pid": parseInt(req.data.pid) },
          { $set: {
            "name": req.data.name,
            "description": req.data.description,
            "input": req.data.input,
            "output": req.data.output,
            "problem_type": req.data.problem_type
          } },
          { safe:true },
          function(err, result) {
            if (err)
              throw new Error(err);
            res.success();
          }
        );
      });
    } else {
      find_missing_casefile(session, req.data.num_case, function(missing) {
        if (missing.length != 0) {
          res.fail("Missing test case " + missing);
          exec("rm -r -f tmp/" + session, function(err) {
            if (err)
              throw new Error(err);
          });
        } else {
          exec("rm -r -f problem/" + req.data.pid, function(err) {
            if (err) {
              exec("rm -r -f tmp/" + session, function(err) {
                if (err)
                  throw new Error(err);
              });
              throw new Error(err);
            }
            fs.rename("tmp/" + session, "problem/" + req.data.pid, function(err) {
              if (err) {
                exec("rm -r -f tmp/" + session, function(err) {
                  if (err)
                    throw new Error(err);
                });
                throw new Error(err);
              }
              req.db.collection("problems", { safe: true, strict: true }, function(err, collection) {
                if (err)
                  throw new Error(err);
                collection.update(
                  { "pid": parseInt(req.data.pid) },
                  { $set: {
                    "name": req.data.name,
                    "description": req.data.description,
                    "input": req.data.input,
                    "output": req.data.output,
                    "problem_type": req.data.problem_type,
                    "num_case": req.data.num_case
                  } },
                  { safe:true },
                  function(err, result) {
                    if (err)
                      throw new Error(err);
                    res.success();
                  }
                );
              });
            });
          });
        }
      });
    }
  }
  
  function handleRemoveProblem(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
    if (req.session.loginLevel == 0) {
      res.fail("You need login first");
      return;
    }
    if (req.session.loginLevel == 1) {
      res.fail("You don't have privilege to remove problem");
      return;
    }
    req.db.collection("problems", { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.remove(
        { pid: req.data.pid },
        { safe: true },
        function (err, result) {
          if (err)
            throw new Error(err);
        }
      );
    });
  }
  
  function handleSubmitCode(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
    if (req.session.loginLevel == 0) {
      res.fail("You need login first");
      return;
    }
    var pid = req.data.pid;
    var username = req.data.username;
    var filename = "/tmp/" + Math.floor(Math.random()*1000007);
    fs.writeFile(filename, req.data.code, function(err) {
      if (err)
        throw new Error(err);
      req.db.collection("problems", { safe: true, strict: true }, function(err, collection) {
        if (err)
          throw new Error(err);
        collection.find({ pid: parseInt(req.data.pid) }).toArray(function(err, docs) {
          if (err)
            throw new Error(err);
          if (docs.length == 0)
            res.fail("No such problem");
          else {
            var sock = net.connect("/tmp/judged.sock", function() {
              sock.setEncoding("utf8");
              sock.on('data', function(data) {
                var score = 0;
                var result = "";
                var i = 0;
                for (; i < data.length; i++)
                  if (data[i]!=' ')
                    score = score * 10 + parseInt(data[i]);
                  else
                    break;
                i++;
                for (; i < data.length; i++)
                  result += data[i];
                res.success({
                  "username": username,
                  "pid": pid,
                  "score": score,
                  "result": result
                });
              });
              var str = (
                "0 " + // language
                filename + " " + // sourcefile
                __dirname + "/problem/"+req.data.pid + " " + // judge_dir
                docs[0].num_case + // num_case
                "\n");
              sock.write(str);
            });
          }
        });
      });
    });
  }
  
  function handleGetResult(req, res) {
    req.db.collection("results", { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find(
        {
          "pid": req.data.pid,
          "username": req.data.username
        }).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        ws.send(JSON.stringify(relative_results));               
      });
    });
  }
  
  env.registerHandler("getProblems", handleGetProblems);
  env.registerHandler("getProblem", handleGetProblem);
  env.registerHandler("addProblem", handleAddProblem);
  env.registerHandler("editProblem", handleEditProblem);
  env.registerHandler("removeProblem", handleRemoveProblem);
  env.registerHandler("submitCode", handleSubmitCode);
}
