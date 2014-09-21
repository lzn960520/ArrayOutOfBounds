var port = 805;
var backend = function() {
	var self = this;
	var queue = [];
	var working = false;
	var waiting = null;
	function onopen() {
		socket.onmessage = function(event) {
			var data = JSON.parse(event.data);
			switch (data.type) {
			  case "error":
			    popup_noti("<span style='color:red'>Error: "+data.content+"</span>");
			    break;
			  case "notification":
			    popup_noti(noti);
			    break;
        default:
          if (queue[0].callback)
          queue[0].callback(data);
          queue.shift();
          work();
          break;
			}
		}
		if (waiting) {
		  clearTimeout(waiting[0]);
		  waiting[1]();
		  waiting = null;
		}
	}
	var socket = new WebSocket("ws://"+location.hostname+":"+port);
	socket.onopen = onopen;
	function work() {
		if (queue.length==0) {
			working = false;
			return;
		} else {
			working = true;
			socket.send(queue[0].data);
		}
	}
	function send(data,callback) {
		var job = {
			"data": data,
			"callback": callback || null
		};
		queue.push(job);
		if (!working)
			work();
	}
	function waitForReady(callback) {
		if ((socket.readyState == socket.CLOSED) || (socket.readyState == socket.CLOSING)) {
			socket = new WebSocket("ws://"+location.hostname+":"+port);
			socket.onopen = onopen;
		}
		if (socket.readyState == socket.OPEN)
			callback();
		else {
			waiting = [
			  setTimeout(function(){
  				if (socket.readyState == socket.OPEN)
  					callback();
  				else
  					popup_noti("<span style='color:red'>Connection timeout</span>");
  			}, 5000),
			  callback
			];
	  }
	}
	self.login = function(username, password, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
				  "type": "login",
					"username": username,
					"password": password
				}), callback
			);
		});
	}
	self.register = function(username, password, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "register",
					"username": username,
					"password": password
				}), callback
			);
		});
	}
	self.getProblem = function(pid, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "getProblem",
					"pid": pid
				}), callback
			);
		});
	}
	self.getProblems = function(callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "getProblems",
				}), callback
			);
		});
	}
	self.getContests = function(callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "getContests",
				}), callback
			);
		});
	}
	self.addProblem = function(name, desc, input, output, session, num_case, type, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "addProblem",
					"name": name,
					"description": desc,
					"input": input,
					"output": output,
					"session": session,
					"num_case": num_case,
					"problem_type": type
				}), callback
			);
		});
	}
	self.editProblem = function(pid, name, desc, input, output, session, num_case, type, callback) {
    waitForReady(function() {
      send(
        JSON.stringify({
          "type": "editProblem",
          "pid": pid,
          "name": name,
          "description": desc,
          "input": input,
          "output": output,
          "session": session,
          "num_case": num_case,
          "problem_type": type
        }), callback
      );
    });
  }
	self.addContest = function(name, begin, end, pids, callback) {
		begin.setSeconds(0);
		end.setSeconds(0);
		waitForReady(function() {
			send(
				JSON.stringify({
					"type": "addContest",
					"name": name,
					"begin": begin,
					"end": end,
					"problems": pids
				}), callback
			);
		});
	}
	self.submitCode = function(username, pid, code, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
				  "type": "submitCode",
					"username": username,
					"code": code,
					"pid": pid
				}), callback
			);
		});
	}
	return this;
}();
