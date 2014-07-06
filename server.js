//library function
function check_username(name){
  var len=name.length;
  if (len<6) return false; else return true;
}
function check_password(password){
  var len=password.length;
  if (len<6) return false;else return true;
}

var fs = require('fs');
var net = require('net');
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
      if (data.type=="check_login"){
        console.log("check login");
        db.collection('users',{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            console.log("try to find whether user has existed");
            collection.find({username:data.username}).toArray(function(err,docs){
              console.log("find");
              console.log(docs);
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
      } else if (data.type=="registration") {
        var username=data.username;
        var password=data.password;
        var confirm_password=data.confirm_password;
        var have_user=null;
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
                  }else{
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
      } else if (data.type=="getProblems") {
        db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              console.log("find the following problems");
              console.log(docs);
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
      } else if (data.type=="getProblem") {
        db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          }else{
            collection.find({pid:data.pid}).toArray(function(err,docs){
              console.log(docs);
              var thisproblem=docs[0];
              var description=thisproblem.description;
              var simple_input=thisproblem.input;
              var simple_output=thisproblem.output;
              var pid=thisproblem.pid;
              var name=thisproblem.name;
              ws.send(JSON.stringify({
                "type": "showproblem",
                "name": name,
                "pid":pid,
                "description":description,
                "simple_input":simple_input,
                "simple_output":simple_output
              }));               
            });
          }
        });      
      } else if (data.type=="submit_code") {
        console.log(data.code);
        console.log(data.pid);
        var pid=data.pid;
        var username=data.username;
        var filename = "/tmp/" + Math.floor(Math.random()*1000007);
        fs.writeFile(filename, data.code, function(err) {
          if (err)
            throw err;
          var sock = net.connect("/tmp/judged.sock", function() {
            sock.setEncoding("utf8");
            sock.on('data', function(data) {
              console.log(data);
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
              for (i;i<data;i++) {
                result+=data[i];
              }
              db.collection('results',{safe:true},function(err,collection){
                console.log("Insert a new result into the database");               
                if (err) {
                  console.log(err);
                } else {
                  collection.find({}).toArray(function(err,docs) {
                    if (err) {
                      cosole.log(err);
                    } else {
                      var newrid=docs.length+1;    
                      collection.insert(
                        { "pid":pid,
                          "username":username,
                          "rid":newrid,
                          "score":score,
                          "result":result
                        },
                        {safe:true},
                        function(err) {
                          if (err)
                            console.log(err);
                        }
                      );
                    }
                  });
                }            
              });
              ws.send(JSON.stringify({
                "type": "showresults",
                "username": username,
                "pid":pid,
                "score":score,
                "result":result
              }));
            });
            sock.write("0 " + filename + " " + data.pid + "\n");
          });
        });
      } else if (data.type=="create_problem") {
        db.collection('problems',{safe:true},function(err,collection){
          console.log("Insert a new problem into the database");                
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              if (err) {
                cosole.log(err);
              } else {
                console.log(docs);
                var newpid=docs.length+1;
              }   
              collection.insert({"name":data.name,"description":data.description,"input":data.input,"output":data.output,"pid":newpid},{safe:true}, function(err, result) {if (err) console.log(err);else console.log("insert successfully");});
              ws.send(JSON.stringify({
                "type": "create_successfully"
              }));
            });
          }
        });
      } else if (data.type=="get_contests") {
        db.collection("contests",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              console.log("find the following contests");
              console.log(docs);
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
      } else if (data.type=="get_contest"){
		  db.collection("contests",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          } else {
              collection.find({"cid":data.cid}).toArray(function(err,docs){
              console.log("find the specific contest");
              console.log(docs);              
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
	  }else if (data.type=="delete_problem"){
		db.collection("problems",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          }else{
			  collection.remove({pid:data.pid},{safe:true},function(err,result){
              	console.log(result);
          		});  
           };
        });      
		  
	  
	  
	  }else if (data.type=="create_post"){
        db.collection('posts',{safe:true},function(err,collection){
          console.log("Insert a new post into the database");                
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              if (err) {
                cosole.log(err);
              } else {
                console.log(docs);
                var newpostid=docs.length+1;
              }   
              collection.insert({"name":data.name,"description":data.description,"username":data.user,"postid":newpostid},{safe:true}, function(err, result) {if (err) console.log(err);else console.log("insert successfully");});
              ws.send(JSON.stringify({
                "type": "create_successfully"
              }));
            });
          }
        });	  			  
	  
	  }else if (data.type=="get_post"){
        db.collection("posts",{safe:true},function(err,collection){
          if (err){
            console.log(err);
          }else{
            collection.find({postid:data.postid}).toArray(function(err,docs){
              console.log(docs);
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
	  
	  	  
	  }else if (data.type=="create_reply"){
	  	
	  
	  
	  }else if (data.type=="get_reply"){
	  
	  
	  
	  
	  
	  
	  
	  
	  }else if (data.type=="create_contest") {
		//Contest 命名规范：日期格式 yyyy mm dd hh mm          pids格式：xxx xxx xxx xxx         
        db.collection('contests',{safe:true},function(err,collection){
          console.log("Insert a new contest into the database");                
          if (err){
            console.log(err);
          } else {
            collection.find({}).toArray(function(err,docs){
              if (err) {
                cosole.log(err);
              } else {
                console.log(docs);
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
                  else
                    console.log("insert successfully");
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