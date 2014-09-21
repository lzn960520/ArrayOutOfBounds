// Import modules
var express = require('express');
var fs = require('fs');
var net = require('net');
var crypto = require('crypto');
var os = require('os');
var exec = require("child_process").exec;
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var domain = require('domain');
var reqres = require('./reqres');

// Messages defination
var REQUEST = {
  "login":          1,
  "registration":   2,
  "getProblems":    3,
  "getProblem":     4,
  "editProblem":    5,
  "addProblem":     6,
  "deleteProblem":  7,
  "getContests":    8,
  "getContest":     9,
  "addContest":     10,
  "editContest":    11,
  "deleteContest":  12,
  "submitCode":     13
}
var RESPONSE = {
  "error":          0,
  "login":          1,
  "registration":   2,
  "getProblems":    3,
  "getProblem":     4,
  "addProblem":     6,
  "getContests":    8,
  "getContest":     9
}

// Library function
function checkUsername(name){
  return name.length >= 6;
}
function checkPassword(password){
  return password.length >= 6;
}
function generateRandom() {
  return crypto.createHash('md5').update(((os.uptime()+os.totalmem())*(os.freemem()+10007)).toString()+(new Date().toISOString())).digest('hex');
}
function findMissingCasefile(dir, max_case, callback) {
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

// Connect to database.
var server = new mongodb.Server('localhost',27017,{auto_reconnect:true});
var db = new mongodb.Db('outofbound', server, {safe:true});
db.open(function(err,db){
  if (!err) { 
    console.log('connect to the database sucessfully');
  } else {
    console.log(err);
    process.exit(-1);
  }
});

// Run upload server
var webapp = express();
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

// Handle messages

function handleGetContests(ws, data) {
  
}

// Handler table
var handles = {
}

// Environment for modules
var env = {
  "registerHandler" : function(name, func) {
    if (!func || typeof func != "function")
      return;
    handles[name] = func;
  }
}

// Load modules
fs.readdir("modules/", function(err, files) {
  if (err) {
    console.log(err);
    return;
  }
  for (var i = 0; i < files.length; i++)
    require("./modules/" + files[i])(env);
    
  // Start web socket server
  function onclose() {
    console.log("Web socket server closed!");
  }
  function onconnection(ws) {
    ws.on('message', function(data) {
      data = JSON.parse(data);
      if (handles[data.type]) {
        var d = domain.create();
        d.on('error', function(err) {
          console.log(err.stack);
          ws.send(JSON.stringify({
            "type": data.type,
            "success": false,
            "reason": "Server crashed"
          }));
          d.dispose();
        });
        d.run(function() {
          console.log("Handle " + JSON.stringify(data));
          handles[data.type](new reqres.Request(ws, data, db), new reqres.Response(ws, data));
        });
      } else
        console.log("Unknown message " + JSON.stringify(data));
    })
  }
  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({ port: 805 },
    function () {
      wss.on('close', onclose);
      wss.on('connection', onconnection);
    }
  );
})
/*
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
*/
