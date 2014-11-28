var port = 8005;
var backend = null;
$(function() {
  backend = function() {
    var self = this;
    function work() {
      if (queue.length == 0) {
        working = false;
        return;
      } else {
        working = true;
        if (queue[0].data)
          socket.send(queue[0].data);
        else {
          queue[0].callback();
          queue.shift();
          work();
        }
      }
    }
    self.login = function(username, password, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "login",
          "session" : self.session,
          "username" : username,
          "password" : password
        }), callback);
      });
    }
    self.register = function(username, password, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "register",
          "session" : self.session,
          "username" : username,
          "password" : password
        }), callback);
      });
    }
    self.logout = function(callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "logout",
          "session" : self.session,
        }), callback);
      });
    }
    self.getProblem = function(pid, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "getProblem",
          "session" : self.session,
          "pid" : pid
        }), callback);
      });
    }
    self.addProblem = function(name, desc, input, output, session, num_case,
        type, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "addProblem",
          "session" : self.session,
          "name" : name,
          "description" : desc,
          "input" : input,
          "output" : output,
          "upload_session" : session,
          "num_case" : num_case,
          "problem_type" : type
        }), callback);
      });
    }
    self.editProblem = function(pid, name, desc, input, output, session,
        num_case, type, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "editProblem",
          "session" : self.session,
          "pid" : pid,
          "name" : name,
          "description" : desc,
          "input" : input,
          "output" : output,
          "upload_session" : session,
          "num_case" : num_case,
          "problem_type" : type
        }), callback);
      });
    }
    self.removeProblem = function(pid, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "removeProblem",
          "session" : self.session,
          "pid" : pid
        }), callback);
      });
    }
    self.addContest = function(name, begin, end, pids, callback) {
      begin.setSeconds(0);
      end.setSeconds(0);
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "addContest",
          "session" : self.session,
          "name" : name,
          "begin" : begin,
          "end" : end,
          "problems" : pids
        }), callback);
      });
    }
    self.submitCode = function(username, pid, code, callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "submitCode",
          "session" : self.session,
          "code" : code,
          "pid" : pid
        }), callback);
      });
    }
    return this;
  }();
});
app.provider("backend", function() {
  var socket = null;
  var queue = [];
  var working = false;
  var waiting = null;
  var self = this;
  var ready = false;
  this.login = {
    "session": $.cookie("session") || null,
    "username": $.cookie("username") || "",
    "role": $.cookie("role") || "nologin",
  }
  this.loginNotifer = null;
  function connect() {
    working = false;
    ready = false;
    socket = io("http://" + location.hostname + ":" + port, { reconnection: false, connect_timeout: 5000 });
    socket.on('connect', function() {
      ready = true;
      var job = {
        "data": JSON.stringify({
          "type" : "openSession",
          "session" : self.login.session,
        }),
        "callback": function(result) {
          if (self.login.session != result.set_session && self.login.role != "nologin") {
            popup_noti("<span style='color:red'>Please login again</span>");
          }
          self.login.session = result.set_session;
          $.cookie("session", self.login.session);
          self.login.username = result.username;
          self.login.role = result.role;
        }
      };
      queue = [ job ].concat(queue);
      work();
    });
    socket.on('connect_error', function() {
      popup_noti("<span style='color:red'>Connection timeout</span>");
      setTimeout(connect, 500);
    })
    socket.on('disconnect', function() {
      ready = false;
      working = false;
      connect();
    });
    socket.on('message', function(data) {
      var data = JSON.parse(data);
      switch (data.type) {
        case "error" :
          popup_noti("<span style='color:red'>Error: " + data.content +
              "</span>");
          break;
        case "notification" :
          popup_noti(data.content);
          break;
        case "resession" :
          queue = [ queue[0] ];
          openSession();
          break;
        default :
          if (queue[0].callback)
            queue[0].callback(data);
          queue.shift();
          work();
          break;
      }
    });
  }
  function work() {
    if (queue.length == 0) {
      working = false;
      return;
    } else {
      working = true;
      if (queue[0].data)
        if (socket != null)
          socket.send(queue[0].data);
      else {
        queue[0].callback();
        queue.shift();
        work();
      }
    }
  }
  function send(data, callback) {
    var job = {
      "data" : data,
      "callback" : callback || null
    };
    queue.push(job);
    if (ready && !working)
      work();
  }
  function waitForReady(callback) {
    callback();
  }
  function openSession() {
    waitForReady(function() {
      send(JSON.stringify({
        "type" : "openSession",
        "session" : self.login.session,
      }), function(result) {
        if (self.session != result.set_session && isNAV(1)) {
          popup_noti("<span style='color:red'>Please login again</span>");
        }
        self.login.session = result.set_session;
        self.login.username = result.username;
        self.login.role = result.role;
        self.loginNotifier.notify(self.login);
      });
    });
  }
  this.$get = [ "$q", function($q) {
    this.loginNotifier = $q.defer();
    this.loginNotifier.promise.then(null, null, function(login) {
      $.cookie("session", login.session);
      if (login.username == "") {
        $.removeCookie("username");
        $.removeCookie("role");
      } else {
        $.cookie("username", login.username);
        $.cookie("role", login.role);
      }
    })
    return {
      "login": this.login,
      "loginNotifier": this.loginNotifier.promise,
      "doLogin": function(username, password, callback) {
        waitForReady(function() {
          send(JSON.stringify({
            "type" : "login",
            "session" : self.login.session,
            "username" : username,
            "password" : password
          }), function(data) {
            if (data.success) {
              self.login.username = data.username;
              self.login.role = data.role;
              self.loginNotifier.notify(self.login);
            }
            if (callback)
              callback(data);
          });
        });
      },
      "doLogout": function() {
        waitForReady(function() {
          send(JSON.stringify({
            "type" : "logout",
            "session" : self.login.session,
          }), function(data) {
            if (data.success) {
              self.login.username = data.username;
              self.login.role = data.role;
              self.loginNotifier.notify(self.login);
            }
            if (callback)
              callback(data);
          });
        });
      },
      "doRegister": function(username, password, callback) {
        waitForReady(function() {
          send(JSON.stringify({
            "type" : "register",
            "session" : self.session,
            "username" : username,
            "password" : password
          }), function(data) {
            if (data.success) {
              self.login.username = data.username;
              self.login.role = data.role;
              self.loginNotifier.notify(self.login);
            }
            if (callback)
              callback(data);
          });
        });
      },
      "getContests": function(callback) {
        waitForReady(function() {
          send(JSON.stringify({
            "type" : "getContests",
            "session" : self.login.session
          }), callback);
        });
      },
      "getProblems": function(callback) {
        waitForReady(function() {
          send(JSON.stringify({
            "type" : "getProblems",
            "session" : self.login.session
          }), callback);
        });
      }
    }
  }];
  connect();
});