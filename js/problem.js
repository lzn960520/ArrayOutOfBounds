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
            "<pre>" + data.simple_input + "</pre>"+
          "</div>"+
          "<div style='border-top:1px solid #e5e5e5'>"+
            "<h4>Sample output</h4>"+
            "<pre>" + data.simple_output + "</pre>"+
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
    $("#add-problem-modal #name").val(),
    $("#add-problem-modal #desc").val(),
    $("#add-problem-modal #input").val(),
    $("#add-problem-modal #output").val(),
    add_problem_session);
}
$(function() {
  $('#add-problem-modal').on("hidden.bs.modal", function(e) {
    var div = $('#add-problem-modal');
    div.find("input").val("");
    div.find("textarea").val("");
    add_problem_session = null;
    $("#add-problem-modal #num-test-cases").val(10);
    $("#add-problem-modal #missing-files").text('all');
    $("#confirm-add-problem-btn").addClass("disabled");
  });
  $("#add-problem-modal #num-test-cases").change(function(e) {
    $("#add-problem-modal #missing-files").text('all');
    $("#confirm-add-problem-btn").addClass("disabled");
  })
  $('#test-cases-upload').fileupload({
    dataType: 'json',
    type: 'POST',
    singleFileUploads: false,
    formData: function() {
      return [
        { name: 'session', value: add_problem_session },
        { name: 'max_case', value: $("#add-problem-modal #num-test-cases").val() }
      ];
    },
    done: function (e, data) {
      if (data.result.missing.length == 0) {
        $("#add-problem-modal #missing-files").text('nothing');
        $("#confirm-add-problem-btn").removeClass("disabled");
      } else {
        $("#add-problem-modal #missing-files").text(data.result.missing.join(', '));
        $("#confirm-add-problem-btn").addClass("disabled");
      }
      add_problem_session = data.result.session;
    },
    progress: function (e, data) {
      if (data.loaded == data.total) {
        $("#add-problem-modal #upload-btn").removeClass('disabled');
        $("#add-problem-modal #upload-info").text('Upload test cases...');
      } else {
        $("#add-problem-modal #upload-btn").addClass('disabled');
        $("#add-problem-modal #upload-info").text((Math.round(data.loaded / data.total * 1000)/10)+"%");
      }
    }
  });
  $("#add-problem-modal")
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
