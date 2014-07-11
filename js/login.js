function toggleSignin() {
  $("#login-div").fadeToggle(300);
}
function toggleSignup() {
  $("#reg-div").fadeToggle(300);
}
function do_login() {
  backend.login($("#login-div #username").val(), $("#login-div #password").val());
  $("#login-div").fadeOut(300);
  return false;
}
function do_reg() {
  if ($("#reg-div #password").val() != $("#reg-div #password2").val()) {
    popup_noti("The passwords you entered must be the same");
    return false;
  }
  backend.reg($("#reg-div #username").val(), $("#reg-div #password").val());
  $("#reg-div").fadeOut(300);
  return false;
};
$(function() {
  $("#login-div").click(function(e) {
    e.stopPropagation();
  });
  $("#reg-div").click(function(e) {
    e.stopPropagation();
  });
  $("#signin").click(function(e) {
    toggleSignin();
    $("#login-div #username").focus();
    $("#reg-div").fadeOut(300);
    e.stopPropagation(); 
  });
  $("#signup").click(function(e) {
    toggleSignup();
    $("#reg-div #username").focus();
    $("#login-div").fadeOut(300);
    e.stopPropagation(); 
  });
  $("#logout").click(function() {
    $.removeCookie("username");
    popup_noti("Logout successful");
    switchGUI("welcome");
    switchNAV(0);
  });
  $(document).click(function(e) {
    $("#login-div").fadeOut(300);
    $("#reg-div").fadeOut(300);
  });
  $("#reg-div #password2").keydown(function(e) {
    if (e.keyCode == 13)
      $("#reg-btn").click();
  });
  if ($.cookie("username") != null) {
    switchNAV(1);
    $("#after-login #username").html($.cookie("username"));
  } else {
    switchNAV(0);
  }
});