function roleChanged() {
  if (backend.username == "") {
    $.removeCookie("username");
    $.removeCookie("role");
  } else {
    $.cookie("username", backend.username);
    $.cookie("role", backend.role);
  }
  $.getScript("js/role_" + backend.role + ".js");
}
function toggleSignin() {
  $("#login-div").fadeToggle(300);
}
function toggleSignup() {
  $("#reg-div").fadeToggle(300);
}
function doLogin() {
  backend.login($("#login-div #username").val(), $("#login-div #password")
      .val(), function(result) {
    if (result.success) {
      backend.username = result.username;
      backend.role = result.role;
      popup_noti("<i>Login successful</i>");
      roleChanged();
    } else {
      popup_noti("<span style='color:red'>Login failed: " + result.reason +
          "</span>");
    }
  });
  $("#login-div").fadeOut(300);
  return false;
}
function doRegister() {
  if ($("#reg-div #password").val() != $("#reg-div #password2").val()) {
    popup_noti("The passwords you entered must be the same");
    return false;
  }
  backend.register(
      $("#reg-div #username").val(),
      $("#reg-div #password").val(),
      function(result) {
        if (result.success) {
          popup_noti("<i>Registration successful</i>");
        } else {
          popup_noti("<span style='color:red'>Registration failed: " +
              result.reason + "</span>");
        }
      });
  $("#reg-div").fadeOut(300);
  return false;
};
function doLogout() {
  backend.logout(function(result) {
    backend.username = result.username;
    backend.role = result.role;
    roleChanged();
  });
}
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
  $(document).click(function(e) {
    $("#login-div").fadeOut(300);
    $("#reg-div").fadeOut(300);
  });
  $("#login-div #password").keydown(function(e) {
    if (e.keyCode == 13)
      $("#login-btn").click();
  });
  $("#reg-div #password2").keydown(function(e) {
    if (e.keyCode == 13)
      $("#reg-btn").click();
  });
});
