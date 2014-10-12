var port = 805;
var backend = null;
$(function() {
  backend = function() {
    var self = this;
    var queue = [];
    var working = false;
    var waiting = null;
    self.session = $.cookie("session") || null;
    self.username = $.cookie("username") || "";
    self.role = $.cookie("role") || "nologin";
    function openSession() {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "openSession",
          "session" : self.session,
        }), function(result) {
          if (self.session != result.set_session && isNAV(1)) {
            popup_noti("<span style='color:red'>Please login again</span>");
          }
          backend.session = result.set_session;
          $.cookie("session", self.session);
          backend.username = result.username;
          backend.role = result.role;
          roleChanged();
          if (waiting) {
            clearTimeout(waiting[0]);
            waiting[1]();
            waiting = null;
          }
        });
      });
    }
    function onopen() {
      socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
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
      }
      openSession();
    }
    var socket = new WebSocket("ws://" + location.hostname + ":" + port);
    socket.onopen = onopen;
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
    function send(data, callback) {
      var job = {
        "data" : data,
        "callback" : callback || null
      };
      queue.push(job);
      if (!working)
        work();
    }
    function waitForReady(callback) {
      if ((socket.readyState == socket.CLOSED) ||
          (socket.readyState == socket.CLOSING)) {
        socket = new WebSocket("ws://" + location.hostname + ":" + port);
        socket.onopen = onopen;
      }
      if (socket.readyState == socket.OPEN)
        callback();
      else {
        waiting = [ setTimeout(function() {
          if (socket.readyState == socket.OPEN)
            callback();
          else
            popup_noti("<span style='color:red'>Connection timeout</span>");
        }, 5000), callback ];
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
    self.getProblems = function(callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "getProblems",
          "session" : self.session
        }), callback);
      });
    }
    self.getContests = function(callback) {
      waitForReady(function() {
        send(JSON.stringify({
          "type" : "getContests",
          "session" : self.session
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
