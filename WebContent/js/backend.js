"use strict";

/*
 * var backend = null; $(function() { backend = new function() { var self =
 * this; function work() { if (queue.length == 0) { working = false; return; }
 * else { working = true; if (queue[0].data) socket.send(queue[0].data); else {
 * queue[0].callback(); queue.shift(); work(); } } } self.login =
 * function(username, password, callback) { waitForReady(function() {
 * send(JSON.stringify({ "type" : "login", "session" : self.session, "username" :
 * username, "password" : password }), callback); }); } self.register =
 * function(username, password, callback) { waitForReady(function() {
 * send(JSON.stringify({ "type" : "register", "session" : self.session,
 * "username" : username, "password" : password }), callback); }); } self.logout =
 * function(callback) { waitForReady(function() { send(JSON.stringify({ "type" :
 * "logout", "session" : self.session, }), callback); }); } self.getProblem =
 * function(pid, callback) { waitForReady(function() { send(JSON.stringify({
 * "type" : "getProblem", "session" : self.session, "pid" : pid }), callback);
 * }); } self.addProblem = function(name, desc, input, output, session,
 * num_case, type, callback) { waitForReady(function() { send(JSON.stringify({
 * "type" : "addProblem", "session" : self.session, "name" : name, "description" :
 * desc, "input" : input, "output" : output, "upload_session" : session,
 * "num_case" : num_case, "problem_type" : type }), callback); }); }
 * self.editProblem = function(pid, name, desc, input, output, session,
 * num_case, type, callback) { waitForReady(function() { send(JSON.stringify({
 * "type" : "editProblem", "session" : self.session, "pid" : pid, "name" : name,
 * "description" : desc, "input" : input, "output" : output, "upload_session" :
 * session, "num_case" : num_case, "problem_type" : type }), callback); }); }
 * self.removeProblem = function(pid, callback) { waitForReady(function() {
 * send(JSON.stringify({ "type" : "removeProblem", "session" : self.session,
 * "pid" : pid }), callback); }); } self.addContest = function(name, begin, end,
 * pids, callback) { begin.setSeconds(0); end.setSeconds(0);
 * waitForReady(function() { send(JSON.stringify({ "type" : "addContest",
 * "session" : self.session, "name" : name, "begin" : begin, "end" : end,
 * "problems" : pids }), callback); }); } self.submitCode = function(username,
 * pid, code, callback) { waitForReady(function() { send(JSON.stringify({ "type" :
 * "submitCode", "session" : self.session, "code" : code, "pid" : pid }),
 * callback); }); } return this; }(); });
 */
app
    .provider(
        "backend",
        [
          "uiProvider",
          function(uiProvider) {
            var socket = null;
            var queue = [];
            var working = false;
            var self = this;
            var ready = false;
            var session_opened = false;
            this.loginInfo = {
              "session" : $.cookie("session") ||
                  "00000000000000000000000000000000",
              "username" : $.cookie("username") || "",
              "role" : $.cookie("role") || "nologin",
            };
            function checkAndReconnect() {
              if (!ready) {
                uiProvider.popup_error("Connection timeout");
                setTimeout(connect, 500);
              }
            }
            function connect() {
              working = false;
              ready = false;
              socket = io("/", {
                reconnection : false,
                connect_timeout : 5000,
                forceNew : true
              });
              socket.on("connect", function() {
                ready = true;
                if (!working)
                  work();
              });
              setTimeout(checkAndReconnect, 5000);
              socket.on("disconnect", function() {
                ready = false;
                working = false;
                connect();
              });
              socket.on("message", function(data) {
                data = JSON.parse(data);
                switch (data.type) {
                  case "error" :
                    uiProvider.popup_error("Error: " + data.content);
                    break;
                  case "notification" :
                    uiProvider.popup_noti(data.content);
                    break;
                  case "resession" :
                    queue = [];
                    session_opened = false;
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
              if (queue.length === 0) {
                working = false;
                return;
              } else {
                working = true;
                if (queue[0].data)
                  if (socket !== null)
                    socket.send(self.loginInfo.session + queue[0].data);
                  else {
                    if (queue[0].callback)
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
            function openSession(callback) {
              waitForReady(function() {
                send(JSON.stringify({
                  "type" : "openSession",
                  "session" : self.loginInfo.session,
                }), callback);
              });
            }
            connect();
            this.$get = [
              "$q",
              "$rootScope",
              "ui",
              function($q, $rootScope, ui) {
                if (!session_opened) {
                  session_opened = true;
                  openSession(function(result) {
                    if (($rootScope.loginInfo.session != result.set_session ||
                        $rootScope.loginInfo.username != result.username || $rootScope.loginInfo.role != result.role) &&
                        $rootScope.loginInfo.role != "nologin") {
                      ui
                          .popup_noti("<span style='color:red'>Please login again</span>");
                    }
                    $rootScope.$apply(function() {
                      $rootScope.loginInfo.session = result.set_session;
                      $rootScope.loginInfo.username = result.username;
                      $rootScope.loginInfo.role = result.role;
                    });
                  });
                }
                $rootScope.loginInfo = this.loginInfo;
                $rootScope.$watch("loginInfo", function() {
                  $.cookie("session", $rootScope.loginInfo.session);
                  $.cookie("username", $rootScope.loginInfo.username);
                  $.cookie("role", $rootScope.loginInfo.role);
                }, true);
                return {
                  "doLogin" : function(username, password, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "login",
                        "username" : username,
                        "password" : password
                      }), function(data) {
                        if (data.success) {
                          $rootScope.$apply(function() {
                            $rootScope.loginInfo.username = data.username;
                            $rootScope.loginInfo.role = data.role;
                          });
                        }
                        if (callback)
                          callback(data);
                      });
                    });
                  },
                  "doLogout" : function(callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "logout",
                      }), function(data) {
                        if (data.success) {
                          $rootScope.$apply(function() {
                            $rootScope.loginInfo.username = data.username;
                            $rootScope.loginInfo.role = data.role;
                          });
                        }
                        if (callback)
                          callback(data);
                      });
                    });
                  },
                  "doRegister" : function(username, password, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "register",
                        "username" : username,
                        "password" : password
                      }), function(data) {
                        if (data.success) {
                          $rootScope.$apply(function() {
                            $rootScope.loginInfo.username = data.username;
                            $rootScope.loginInfo.role = data.role;
                          });
                        }
                        if (callback)
                          callback(data);
                      });
                    });
                  },
                  "getContests" : function(callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "getContests",
                      }), callback);
                    });
                  },
                  "getProblems" : function(callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "getProblems",
                      }), callback);
                    });
                  },
                  "getProblem" : function(pid, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "getProblem",
                        "pid" : pid
                      }), callback);
                    });
                  },
                  "submitCode" : function(code, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "submitCode",
                        "code" : code
                      }), callback);
                    });
                  },
                  "getStudents" : function(callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "getStudents"
                      }), callback);
                    });
                  },
                  "addProblem" : function(name, desc, input, output, session,
                      num_case, type, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "addProblem",
                        "name" : name,
                        "description" : desc,
                        "input" : input,
                        "output" : output,
                        "upload_session" : session,
                        "num_case" : num_case,
                        "problem_type" : type
                      }), callback);
                    });
                  },
                  "addHomework" : function(name, desc, begintime, endtime,
                      problems, callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "addHomework",
                        "name" : name,
                        "description" : desc,
                        "begintime" : begintime,
                        "endtime" : endtime,
                        "problems" : problems
                      }), callback);
                    });
                  },
                  "getHomeworks" : function(callback) {
                    waitForReady(function() {
                      send(JSON.stringify({
                        "type" : "getHomeworks"
                      }), callback);
                    });
                  }
                };
              } ];
          } ]);
