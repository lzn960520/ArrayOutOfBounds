var port = 805;
var backend=function(){
	var self = this;
	var socket = new WebSocket("ws://"+location.hostname+":"+port);
	var ready = false;
	var queue = [];
	var working = false;
	socket.onopen = function() {
		ready = true;
		socket.onmessage = function(event) {
			var data = JSON.parse(event.data);
			if (data.type == "error_message") {
				popup_noti("<span style='color:red'>Error: "+data.content+"</span>");
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
				var name=data.name;
				var pid=data.pid;
				var n=name.length;
				var i=0;
				var content="<thead><tr><th>ID</th><th>Name</th></tr></thead><tbody>"
				for (i=0;i<n;i++)
					content+="<tr class='problem-row' pid='"+pid[i]+"' name='"+name[i]+"'><td>"+pid[i]+"</td><td>"+name[i]+"</td></tr>";
				content+="</tbody>";
				$("#problems-table").html(content);
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
			}
			if (queue[0].callback)
				queue[0].callback(data);
			queue.shift();
			work();
		}
	}
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
		if (ready)
			callback();
		else
			setTimeout(function(){
				if (ready)
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
	self.create_problem = function(name, desc, input, output) {
		waitForReady(function() {
			send(
				JSON.stringify({
					"type":"create_problem",
					"name":name,
					"description":desc,
					"input":input,
					"output":output
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
	return this;
}();
