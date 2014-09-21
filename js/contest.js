function doAddContest() {
  backend.addContest(
    $("#add-contest-modal #name").val(),
    $("#add-contest-modal #begintime").datetimepicker('getDate'),
    $("#add-contest-modal #endtime").datetimepicker('getDate'),
    $("#add-contest-modal #problems").val().replace(/\s*/g,"").split(','),
    function(result) {
      if (result.success) {
        popup_noti("Add contest successfully");
      } else {
        popup_noti("<span style='color:red'>Add contest failed: " + result.reason + "</span>");
      }
    }
  );
  $('#add-contest-modal .userinput').val('');
}

function doGetContests() {
  backend.getContests(function(result) {
    if (result.success) {
      var content = "<thead><tr><th>ID</th><th>Name</th><th>Begin time</th><th>End time</th></thead><tbody>";
      var length = result.length;
      for (var i = 0; i < length; i++) {
        content +=
          "<tr>"+
            "<td>"+result.cid[i]+"</td>"+
            "<td>"+result.name[i]+"</td>"+
            "<td>"+new Date(result.begin[i]).toLocaleString()+"</td>"+
            "<td>"+new Date(result.end[i]).toLocaleString()+"</td>"+
          "</tr>";
        if (i == 9)
          $("#newest-contests-table").html(content);
      }
      if (i < 9)
        $("#newest-contests-table").html(content);
      $("#contests-table").html(content);      
    } else {
      popup_noti("<span style='color:red'>Get contests failed: " + result.reason + "</span>");
    }
  });
}
