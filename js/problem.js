var add_problem_session = null;
function addProblemDiv(pid, callback) {
  backend.getProblem(pid, function(data) {
    //data.description = data.description.replace(/\n/g, "<br />");
    //data.simple_input = data.simple_input.replace(/\n/g, "<br />");
    //data.simple_output = data.simple_output.replace(/\n/g, "<br />");
    $("#main #body").append(
      "<div class='ui' id='ui-p"+pid+"'>"+
        "<div id='desc' class='module'>"+
          "<h3>"+data.name+"</h3>"+
          "<div style='border-top:1px solid #e5e5e5'>"+
            "<h4>Description</h4>"+
            "<pre>" + data.description + "</pre>"+
          "</div>"+
          "<div style='border-top:1px solid #e5e5e5'>"+
            "<h4>Sample input</h4>"+
            "<pre>" + data.input + "</pre>"+
          "</div>"+
          "<div style='border-top:1px solid #e5e5e5'>"+
            "<h4>Sample output</h4>"+
            "<pre>" + data.output + "</pre>"+
          "</div>"+
          "<button class='btn btn-success show-submit-problem-btn' pid='" + pid + "' style='margin-left:90%;width:10%'>Submit</button>"+
        "</div>"+
        "<div id='submit' class='module'>"+
          "<h3>Submit</h3>"+
          "<div style='position: relative;height:500px;margin-bottom:20px'>"+
            "<div id='submit-editor'></div>"+
          "</div>"+
          "<div>"+
            "<button style='margin-left:77%;width:10%' class='btn btn-danger cancel-submit-problem-btn' pid='" + pid + "'>Cancel</button>"+
            "<button style='margin-left:3%;width:10%' class='btn btn-success confirm-submit-problem-btn' pid='" + pid + "'>Submit</button>"+
          "</div>"+
        "</div>"+
      "</div>");
    $("#main #body #ui-p"+pid+" #submit").hide();
    var editor = ace.edit($("#main #body #ui-p"+pid+" #submit #submit-editor").get(0));
    editor.setTheme("ace/theme/twilight");
    editor.getSession().setMode("ace/mode/c_cpp");
    editor_session[pid] = editor;
    callback();
  });
}
function do_add_problem() {
  backend.create_problem(
    $("#add-edit-problem-modal #name").val(),
    $("#add-edit-problem-modal #desc").val(),
    $("#add-edit-problem-modal #input").val(),
    $("#add-edit-problem-modal #output").val(),
    add_problem_session,
    $("#add-edit-problem-modal #num-test-cases").val(),
    $("#add-edit-problem-modal #type").val());
}
function do_edit_problem() {
  backend.edit_problem(
    $("#add-edit-problem-modal").attr("pid"),
    $("#add-edit-problem-modal #name").val(),
    $("#add-edit-problem-modal #desc").val(),
    $("#add-edit-problem-modal #input").val(),
    $("#add-edit-problem-modal #output").val(),
    add_problem_session,
    $("#add-edit-problem-modal #num-test-cases").val(),
    $("#add-edit-problem-modal #type").val());
}
function show_add_problem() {
  $("#add-edit-problem-modal .modal-title").text("Add problem");
  $("#add-edit-problem-modal #confirm-add-problem-btn").show();
  $("#add-edit-problem-modal #confirm-edit-problem-btn").hide();
  $("#add-edit-problem-modal").modal();
}
function show_problems(data) {
  var name=data.name;
  var pid=data.pid;
  var n=name.length;
  var i=0;
  var content=
    "<thead><tr>"+
      "<th>ID</th>"+
      "<th>Name</th>"+
    "</tr></thead><tbody>";
  for (i=0;i<n;i++) {
    content+=
      "<tr class='problem-row' pid='"+pid[i]+"' name='"+name[i]+"'>"+
        "<td>"+pid[i]+"</td>"+
        "<td>"+name[i]+"</td>"+
        "<td width='32'><span class='glyphicon glyphicon-wrench edit'></span></td>"+
      "</tr>";
  }
  content+="</tbody>";
  $("#problems-table").html(content);
}
function show_edit_problem(pid) {
  backend.getProblem(pid, function(data) {
    $("#add-edit-problem-modal").attr("pid", pid);
    $("#add-edit-problem-modal .modal-title").text("Edit problem");
    $("#add-edit-problem-modal #name").val(data.name);
    $("#add-edit-problem-modal #desc").val(data.description);
    $("#add-edit-problem-modal #input").val(data.input);
    $("#add-edit-problem-modal #output").val(data.output);
    $("#add-edit-problem-modal #type").val(data.problem_type);
    $("#add-edit-problem-modal #num-test-cases").val(data.num_case);
    $("#add-edit-problem-modal #missing-files").text('nothing');
    $("#confirm-edit-problem-btn").removeClass("disabled");
    $("#add-edit-problem-modal #confirm-add-problem-btn").hide();
    $("#add-edit-problem-modal #confirm-edit-problem-btn").show();
    $("#add-edit-problem-modal").modal();
  });
}
$(function() {
  $('#add-edit-problem-modal').on("hidden.bs.modal", function(e) {
    var div = $('#add-edit-problem-modal');
    div.find("input").val("");
    div.find("textarea").val("");
    div.find("#type").val("undefined");
    add_problem_session = null;
    $("#add-edit-problem-modal #num-test-cases").val(10);
    $("#add-edit-problem-modal #missing-files").text('all');
    $("#confirm-add-problem-btn").addClass("disabled");
    $("#confirm-edit-problem-btn").addClass("disabled");
  });
  $("#add-edit-problem-modal #num-test-cases").change(function(e) {
    $("#add-edit-problem-modal #missing-files").text('all');
    $("#confirm-add-problem-btn").addClass("disabled");
    $("#confirm-edit-problem-btn").addClass("disabled");
  })
  $('#test-cases-upload').fileupload({
    dataType: 'json',
    type: 'POST',
    singleFileUploads: false,
    formData: function() {
      return [
        { name: 'session', value: add_problem_session },
        { name: 'max_case', value: $("#add-edit-problem-modal #num-test-cases").val() }
      ];
    },
    done: function (e, data) {
      $("#add-edit-problem-modal #upload-info").text('Upload test cases...');
      $("#add-edit-problem-modal #upload-btn").removeClass("disabled");
      if (data.result.missing.length == 0) {
        $("#add-edit-problem-modal #missing-files").text('nothing');
        $("#confirm-add-problem-btn").removeClass("disabled");
        $("#confirm-edit-problem-btn").removeClass("disabled");
      } else {
        $("#add-edit-problem-modal #missing-files").text(data.result.missing.join(', '));
        $("#confirm-add-problem-btn").addClass("disabled");
        $("#confirm-edit-problem-btn").addClass("disabled");
      }
      add_problem_session = data.result.session;
    },
    progress: function (e, data) {
      if (data.loaded == data.total) {
        $("#add-edit-problem-modal #upload-info").text('Uploaded, processing');
        $("#add-edit-problem-modal #upload-btn").addClass("disabled");
      } else {
        $("#add-edit-problem-modal #upload-info").text((Math.round(data.loaded / data.total * 1000)/10)+"%");
      }
    }
  });
  $("body").delegate('.problem-row','click',function(e) {
    var pid=e.currentTarget.getAttribute("pid");
    if ($("#tab-p"+pid).length != 0)
      switchGUI("p"+pid);
    else {
      var name=e.currentTarget.getAttribute("name");
      addTab("p"+pid,name);
      addProblemDiv(pid, function(){
        switchGUI("p"+pid);
      });
    }
  });
  $("body").delegate('.problem-row .edit','click',function(e) {
    show_edit_problem(e.currentTarget.parentElement.parentElement.getAttribute("pid"));
    e.stopPropagation();
  });
  $("body").delegate(".show-submit-problem-btn", "click", function(e) {
    var pid = e.currentTarget.getAttribute("pid");
    var desc_div = $("#main #body #ui-p"+pid+" #desc");
    var submit_div = $("#main #body #ui-p"+pid+" #submit");
    desc_div.hide();
    submit_div.show();
  });
  $("body").delegate(".cancel-submit-problem-btn", "click", function(e) {
    var pid = e.currentTarget.getAttribute("pid");
    var desc_div = $("#main #body #ui-p"+pid+" #desc");
    var submit_div = $("#main #body #ui-p"+pid+" #submit");
    desc_div.show();
    submit_div.hide();
  });
  $("body").delegate(".confirm-submit-problem-btn", "click", function(e) {
    var pid = e.currentTarget.getAttribute("pid");
    var desc_div = $("#main #body #ui-p"+pid+" #desc");
    var submit_div = $("#main #body #ui-p"+pid+" #submit");
    desc_div.show();
    submit_div.hide();
    backend.submit_code($.cookie("username"), editor_session[pid].getValue(), pid);
  });
});
