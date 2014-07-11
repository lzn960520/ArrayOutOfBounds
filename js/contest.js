function do_add_contest() {
  backend.create_contest(
    $("#add-contest-modal #name").val(),
    $("#add-contest-modal #begintime").datetimepicker('getDate'),
    $("#add-contest-modal #endtime").datetimepicker('getDate'),
    $("#add-contest-modal #problems").val().replace(/\s*/g,"").split(','));
  $('#add-contest-modal .userinput').val('');
}