var port = 805;
var backend=function(){
	var self = this;
	var queue = [];
	var working = false;
	function onopen() {
		socket.onmessage = function(event) {
			var data = JSON.parse(event.data);
			if (data.type == "error_message") {
				popup_noti("<span style='color:red'>Error: "+data.content+"</span>");
			} else if (data.type == "noti_message") {
			  popup_noti(data.content);
			} else if (data.type == "create_successfully") {
				popup_noti("Create successful");
			} else if (data.type == "registration_successfully") {
				switchGUI("problems");
				switchNAV(1);
				$("#after-login #username").html(data.username);
				popup_noti("Registration successful");
			} else if (data.type == "login_successfully") {
				switchGUI("problems");
				switchNAV(1);
				$("#after-login #username").html(data.username);
				$.cookie("username",data.username);
				popup_noti("<i>Login successful</i>");
			} else if (data.type == "showproblems") {
			  show_problems(data);
			} else if (data.type == "showcontests") {
				var content = "<thead><tr><th>ID</th><th>Name</th><th>Begin time</th><th>End time</th></thead><tbody>";
				var length=data.cid.length;
				for (var i=0;i<length;i++) {
					content+="<tr><td>"+data.cid[i]+"</td><td>"+data.name[i]+"</td><td>"+new Date(data.begin[i]).toLocaleString()+"</td><td>"+new Date(data.end[i]).toLocaleString()+"</td></tr>";
					if (i==9)
						$("#newest-contests-table").html(content);
				}
				if (i<9)
					$("#newest-contests-table").html(content);
				$("#contests-table").html(content);
			} else if (data.type == "showresult") {
				if (data.score == 100) {
					popup_noti("<span style='color:green'>P"+data.pid+": Accepted</span>");
				} else {
					popup_noti("<span style='color:yellow'>P"+data.pid+": "+data.result+" "+data.score+"/100</span>");
				}
			}
			if (queue[0].callback)
				queue[0].callback(data);
			queue.shift();
			work();
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
			"data":data,
			"callback":callback || null
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
		else
			setTimeout(function(){
				if (socket.readyState == socket.OPEN)
					callback();
				else
					popup_noti("<span style='color:red'>Connection timeout</span>");
			}, 5000);
	}
	self.login=function(username, password) {
		waitForReady(function() {
			send(
				JSON.stringify(
					{	"type":"check_login",
						"username": username,
						"password": password
					}
				)
			);
		});
	}
	self.reg=function(username,password) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"registration",
					"username": username,
					"password": password
				})
			);
		});
	}
	self.getProblem = function(pid, callback) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"getProblem",
					"pid":pid
				}), callback
			);
		});
	}
	self.getProblems = function() {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"getProblems",
				})
			);
		});
	}
	self.getContests = function() {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"get_contests",
				})
			);
		});
	}
	self.create_problem = function(name, desc, input, output, session, num_case, type) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"create_problem",
					"name":name,
					"description":desc,
					"input":input,
					"output":output,
					"session":session,
					"num_case":num_case,
					"problem_type":type
				})
			);
		});
	}
	self.create_problem = function(pid, name, desc, input, output, session, num_case, type) {
    waitForReady(function() {
      send(
        JSON.stringify({
          "type":"edit_problem",
          "pid":pid,
          "name":name,
          "description":desc,
          "input":input,
          "output":output,
          "session":session,
          "num_case":num_case,
          "problem_type":type
        })
      );
    });
  }
	self.create_contest = function(name, begin, end, pids) {
		begin.setSeconds(0);
		end.setSeconds(0);
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"create_contest",
					"name":name,
					"begin":begin,
					"end":end,
					"problems":pids
				})
			);
		});
	}
	self.submit_code = function(username, code, pid) {
		waitForReady(function() {
			send(
				JSON.stringify({"type":"submit_code",
					"username":username,
					"code":code,
					"pid": pid
				})
			);
		});
	}
	return this;
}();
