//library function
function check_username(name){
  var len=name.length;
  if (len<6) return false; else return true;
}
function check_password(password){
  var len=password.length;
  if (len<6) return false;else return true;
}
var crypto = require('crypto');
var os = require('os');
function generateRandom() {
  return crypto.createHash('md5').update(((os.uptime()+os.totalmem())*(os.freemem()+10007)).toString()+(new Date().toISOString())).digest('hex');
}
var express = require('express');
var fs = require('fs');
var net = require('net');

function find_missing_casefile(dir, max_case, callback) {
  if (!callback)
    return;
  fs.readdir("tmp/" + dir, function(err, files) {
    if (err) {
      console.log(err);
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
function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}
var webapp = express();
var bodyParser = require('body-parser');
webapp.use(bodyParser.urlencoded({extended:false}));
webapp.use(require('connect-multiparty')());
webapp.use(express.static(__dirname));
webapp.post("/uploadcasefile", function(req, res) {
  var session = req.body.session;
  if ((typeof session == "undefined") || (session == null) || (session == "null") || (session == "")) {
    session = generateRandom();
    fs.mkdirSync(__dirname + "/tmp/" + session + "/");
  }
  var files = req.files.upload;
  if (!isArray(files))
    files = [files];
  var processed = 0;
  files.forEach(function(file) {
  	if (file.name.match(/[1-9][0-9]*.(in|out)/)) {
  	  fs.readFile(file.path, function(err, data) {
  	  	if (err) {
  	  	  console.log(err);
  	  	  processed++;
  	  	  return;
  	  	}
  	  	file.name = file.name.match(/([1-9][0-9]*.(in|out))/)[0];
  	  	fs.writeFile(__dirname + "/tmp/" + session + "/" + file.name, data, function(err) {
  	  	  if (err) {
  	  	    console.log(err);
  	  	    processed++;
  	  	    return;
  	  	  }
  	      processed++;
  	  	  if (processed == files.length)
  	  	    find_missing_casefile(session, Number(req.body.max_case), function(missing) {
  	  	      res.end(
                JSON.stringify({
                  "missing": missing,
                  "session": session
                })
              );
  	  	    });
  	  	});
  	  	fs.unlink(file.path);
  	  })
  	} else {
  	  fs.unlink(file.path);
  	  processed++;
  	  if (processed == files.length)
        find_missing_casefile(session, Number(req.body.max_case), function(missing) {
          res.end(
            JSON.stringify({
              "missing": missing, 
              "session": session
            })
          );
        });
  	}
  });
})
var server = webapp.listen(8000, function() {
  console.log('Express listening on port %d', 8000);
})
//Connect to my database.
var mongodb = require('mongodb');
var server = new mongodb.Server('localhost',27017,{auto_reconnect:true});
var db = new mongodb.Db('outofbound',server,{safe:true});
db.open(function(err,db){
  if (!err) {   
    console.log('connect to the database sucessfully');
  } else {
    console.log(err);
  }
});

//Set the websocket
var config = require('./config_node.js');
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({port: config.port}, function(){
  console.log("listening");
  wss.on('close', function() {
    console.log('websocket disconnected');
  });

  //declar broadcast function for wss
  wss.broadcast = function(data) {
    for (var i in this.clients)
      this.clients[i].send(data);
  };

  //Listen to the port and do reaction
  wss.on('connection', function(ws) {
    ws.on('message', function(message) {
      console.log(message);
      var data = JSON.parse(message);
      if (data.type == "check_login"){
        db.collection('users',{safe:true},function(err, collection){
          if (err){
            console.log(err);
          } else {
            collection.find({username:data.username}).toArray(function(err,docs){
              var have_user=docs;
              if (have_user.length==0){
                ws.send(JSON.stringify({
                  "type": "error_message",
                  "content": "User does not exist"
                }));
              } else {
                var real_password=have_user[0].password;
                if (real_password!=data.password){
                  ws.send(JSON.stringify({
                    "type": "error_message",
                    "content": "Password is not correct"
                  }));
                } else {
                  ws.send(JSON.stringify({
                    "type": "login_successfully",
                    "username": data.username
                  }));                
                }
              }
            });
          }
        });
      } else if (data.type == "registration") {
        var username = data.username;
        var password = data.password;
        var confirm_password = data.confirm_password;
        var have_user = null;
        db.collection('users',{safe:true},function(err,collection){
          if (err) {
            console.log(err);
          } else {
            collection.find({username:data.username}).toArray(function(err,docs){
              have_user=docs;
              if (have_user.length!=0){
                ws.send(JSON.stringify({
                  "type": "error_message",
                  "content": "Username has been taken"
                }));
              } else if (!check_username(username)) {
                ws.send(JSON.stringify({
                  "type": "error_message",
                  "content": "Username should be a string whose length is larger than 6 and consist of number and alphabets"
                }));  
              } else if (!check_password(password)) {
                ws.send(JSON.stringify({
                  "type": "error_message",
                  "content": "Password should be a string whose length is larger than 6 and consist of number and alphabets"
                }));  
              } else {
                db.collection('users',{safe:true},function(err,collection){
                  if (err){
                    console.log(err);
                  } else {
                    collection.insert({"username":data.username,"password":data.password},{safe:true}, function(err, result) {});
                    ws.send(JSON.stringify({
                      "type": "registration_successfully",
                      "username": data.username
                    }));
                  }
                });
              }
            }); 
          }
        });
      } else if (data.type == "getProblems") {
        db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              var len=docs.length;
              var i=0;
              var name=new Array(len);
              var pid=new Array(len);
              for (i;i<len;i++) {
                name[i]=docs[i].name;
                pid[i]=docs[i].pid;
              }
              ws.send(JSON.stringify({
               "type": "showproblems",
                "name": name,
                "pid":pid
              }));               
            });
          }
        });
      } else if (data.type == "getProblem") {
        db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          }else{
            collection.find({pid:Number(data.pid)}).toArray(function(err,docs){
              var thisproblem=docs[0];
              ws.send(JSON.stringify({
                "type": "showproblem",
                "name": thisproblem.name,
                "pid": thisproblem.pid,
                "description": thisproblem.description,
                "input": thisproblem.input,
                "output": thisproblem.output,
                "num_case": thisproblem.num_case,
                "type": thisproblem.type
              }));               
            });
          }
        });      
      } else if (data.type == "edit_problem") {
        if (!data.session) {
          db.collection("problems", {safe:true}, function(err, collection) {
            if (err) {
              console.log(err);
              ws.send(JSON.stringify({
                "type": "error_message",
                "content": "Database operation failed"
              }));
            } else {
              collection.update(
                { "pid": parseInt(data.pid) },
                { $set: {
                  "name": data.name,
                  "description": data.description,
                  "input": data.input,
                  "output": data.output,
                  "problem_type": data.problem_type
                } },
                { safe:true },
                function(err, result) {
                  if (err) {
                    ws.send(JSON.stringify({
                      "type": "error_message",
                      "content": err
                    }));
                  } else {
                    ws.send(JSON.stringify({
                      "type": "noti_message",
                      "content": "Update successfully"
                    }));
                  }
                }
              );
            }
          });
        } else {
          find_missing_casefile(data.session, data.num_case, function(missing) {
            if (missing.length != 0) {
              ws.send(JSON.stringify({
                "type": "error_message",
                "content": "Missing test case "+missing
              }));
              fs.rmdir("tmp/"+data.session, function(err){
                console.log(err);
              });
            } else {
              fs.rmdir("problem/"+data.pid, function(err) {
                if (err) {
                  console.log(err);
                  ws.send(JSON.stringify({
                    "type": "error_message",
                    "content": "Delete problem directory failed"
                  }));
                  fs.rmdir("tmp/"+data.session, function(err){
                    console.log(err);
                  });
                } else {
                  fs.rename("tmp/"+data.session, "problem/"+newpid, function(err) {
                    if (err) {
                      console.log(err);
                      ws.send(JSON.stringify({
                        "type": "error_message",
                        "content": "Create problem directory failed"
                      }));
                      fs.rmdir("tmp/"+data.session, function(err) {
                        if (err)
                          console.log(err);
                      });
                    } else {
                      db.collection("problems", {safe:true}, function(err, collection) {
                        if (err) {
                          console.log(err);
                          ws.send(JSON.stringify({
                            "type": "error_message",
                            "content": "Database operation failed"
                          }));
                        } else {
                          collection.update(
                            { "pid": parseInt(data.pid) },
                            { $set: {
                              "name": data.name,
                              "description": data.description,
                              "input": data.input,
                              "output": data.output,
                              "problem_type": data.problem_type,
                              "num_case": data.num_case
                            } },
                            { safe:true },
                            function(err, result) {
                              if (err) {
                                console.log(err);
                                ws.send(JSON.stringify({
                                  "type": "error_message",
                                  "content": "Database operation failed"
                                }));
                              } else {
                                ws.send(JSON.stringify({
                                  "type": "noti_message",
                                  "content": "Update successfully"
                                }));
                              }
                            }
                          );
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      } else if (data.type=="get_result_with_user_problem"){
        db.collection("results",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({"pid":data.pid,"username":data.username}).toArray(function(err,docs){
              if (err) {
                console.log(err);
                ws.send(JSON.stringify([]));
              }
              ws.send(JSON.stringify(relative_results));               
            });
          }
        });
      } else if (data.type == "submit_code") {
        var pid=data.pid;
        var username=data.username;
        var filename = "/tmp/" + Math.floor(Math.random()*1000007);
        fs.writeFile(filename, data.code, function(err) {
          if (err)
            throw err;
          db.collection("problems",{safe:true},function(err,collection){
            if (err){
              console.log(err);
              ws.send(JSON.stringify({
                "type": "error_message",
                "content": "Couldn't open database"
              }));
            } else {
              collection.find({pid:Number(data.pid)}).toArray(function(err,docs){
                if ((err) || (docs.length == 0)) {
                  console.log(err);
                  ws.send(JSONJSON.stringify({
                    "type": "error_message",
                    "content": "Couldn't read the problem"
                  }));
                } else {
                  var sock = net.connect("/tmp/judged.sock", function() {
                    sock.setEncoding("utf8");
                    sock.on('data', function(data) {
                      var score=0;
                      var result="";
                      var i=0;
                      for (i;i<data.length;i++){
                        if (data[i]!=' ') {
                          score=score*10+parseInt(data[i]);
                        } else {
                          break;
                        }
                      }
                      i=i+1;
                      for (i;i<data.length;i++) {
                        result+=data[i];
                      }
                      ws.send(JSON.stringify({
                        "type": "showresult",
                        "username": username,
                        "pid":pid,
                        "score":score,
                        "result":result
                      }));
                    });
                    var str=(
                      "0 " + // language
                      filename+" " + // sourcefile
                      __dirname+"/problem/"+data.pid+" " + // judge_dir
                      docs[0].num_case + // num_case
                      "\n");
                    sock.write(str);
                  });
                }
              });
            }
          });
        });
      } else if (data.type == "create_problem") {
        if (!data.session) {
          ws.send(JSON.stringify({
            "type": "error_message",
            "content": "Bad session"
          }));
        } else {
          find_missing_casefile(data.session, data.num_case, function(missing) {
            if (missing.length != 0) {
              ws.send(JSON.stringify({
                "type": "error_message",
                "content": "Missing test case "+missing
              }));
              fs.rmdir("tmp/"+data.session, function(err){
                console.log(err);
              });
            } else {
              fs.rename("tmp/"+data.session, "problem/"+newpid, function(err) {
                if (err) {
                  console.log(err);
                  ws.send(JSON.stringify({
                    "type": "error_message",
                    "content": "Create problem directory failed"
                  }));
                  fs.rmdir("tmp/"+data.session, function(err){
                    console.log(err);
                  });
                } else {
                  db.collection('problems', {safe:true}, function(err,collection){             
                    if (err){
                      console.log(err);
                      ws.send(JSON.stringify({
                        "type": "error_message",
                        "content": "Database operation failed"
                      }));
                    } else {
                      collection.find({}).toArray(function(err,docs){
                        if (err) {
                          cosole.log(err);
                          ws.send(JSON.stringify({
                            "type": "error_message",
                            "content": "Database operation failed"
                          }));
                        } else {
                          var newpid=docs.length+1;
                          collection.insert(
                            {
                              "name":data.name,
                              "description":data.description,
                              "input":data.input,
                              "output":data.output,
                              "pid":newpid,
                              "num_case":data.num_case,
                              "type":data.type
                            }, 
                            {safe:true},
                            function(err, result) {
                              if (err) {
                                console.log(err);
                                ws.send(JSON.stringify({
                                  "type": "error_message",
                                  "content": "Database operation failed"
                                }));
                              } else {
                                ws.send(JSON.stringify({
                                  "type": "noti_message",
                                  "content": "Create successfully"
                                }));
                              }
                            }
                          );
                        }
                      });
                    }
                  });
                }
              })
            }
          });
        }
      } else if (data.type == "get_contests") {
        db.collection("contests",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              var len=docs.length;
              var i=0;
              var name=new Array(len);
              var cid=new Array(len);
      			  var begin=new Array(len);
      			  var end=new Array(len);
              for (i;i<len;i++){
                name[i]=docs[i].name;
                cid[i]=docs[i].cid;
        				begin[i]=docs[i].begin;
        				end[i]=docs[i].end;
              }
              ws.send(JSON.stringify({
                "type": "showcontests",
                "name": name,
                "cid":cid,
        				"begin":begin,
        				"end":end,
              }));               
            });
          }
        });
      } else if (data.type == "get_contest"){
		    db.collection("contests",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
              collection.find({"cid":data.cid}).toArray(function(err,docs){         
			        var thiscontest=docs[0];
              //var description=thiscontest.description;
              var begin=thiscontest.begin;
              var end=thiscontest.end;
              var pids=thiscontest.problems;
              var name=thiscontest.name;
              ws.send(JSON.stringify({
                "type": "showcontest",
                "name": name,
                "pids":pids,
                "begin":begin,
                "end":end
              }));         
            });
          }
        });
  	  } else if (data.type == "delete_problem") {
  		  db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
      		  collection.remove(
      		    {pid: data.pid},
      		    {safe: true},
      		    function (err, result) {
              	if (err)
              	  console.log(err);
          		}
      		  );
          };
        });
  	  } else if (data.type == "create_post") {
        db.collection('posts',{safe:true},function(err,collection){               
          if (err) {
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs) {
              if (err) {
                cosole.log(err);
              } else {
                var newpostid=docs.length+1;
              }   
              collection.insert(
                {
                  "name": data.name,
                  "description": data.description,
                  "username": data.user,
                  "postid": newpostid
                },
                {safe:true},
                function (err, result) {
                  if (err)
                    console.log(err);
                }
              );
              ws.send(JSON.stringify({
                "type": "create_successfully"
              }));
            });
          }
        });
  	  } else if (data.type == "get_post"){
        db.collection("posts", {safe:true}, function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({postid:data.postid}).toArray(function(err,docs){
              var thispost=docs[0];
              var description=thispost.description;
              var name=thispost.name;
              var author=thispost.username;
              var pid=thispost.pid;
  		        var postid=thispost.postid;
              ws.send(JSON.stringify({
                "type": "showpost",
                "name": name,
                "pid":pid,
                "description":description,
                "author":user,
                "postid":postid
              }));             
            });
          }
        });
  	  } else if (data.type=="create_reply") {
  	  } else if (data.type=="get_reply") {
  	  } else if (data.type=="create_contest") {      
        db.collection('contests',{safe:true},function(err,collection){               
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              if (err) {
                cosole.log(err);
              } else {
                var newcid=docs.length+1;
              }
              collection.insert(
                { "name":data.name,
                  "begin":data.begin,
                  "end":data.end,
                  "problems":data.problems,
                  "cid":newcid
                },
                {safe:true},
                function(err, result) {
                  if (err)
                    console.log(err);
                }
              );
              ws.send(JSON.stringify({
                "type": "create_successfully"
              }));
            });
          }
        });
      }
    });
  });
});
