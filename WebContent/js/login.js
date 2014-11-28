function toggleSignin() {
  $("#login-div").fadeToggle(300);
}
function toggleSignup() {
  $("#reg-div").fadeToggle(300);
}
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
});
app.controller("login_ctrl", [ "$scope", "backend", function($scope, backend) {
  $scope.username = "";
  $scope.password = "";
  backend.loginNotifier.then(function(login) {
    $.getScript("js/role_" + login.role + ".js");
  })
  $scope.login = function() {
    backend.doLogin($scope.username, $scope.password, function(result) {
      if (result.success) {
        popup_noti("<i>Login successful</i>");
      } else {
        popup_noti("<span style='color:red'>Login failed: " + result.reason +
            "</span>");
      }
    });
    $("#login-div").fadeOut(300);
  }
  $scope.register = function() {
    if ($scope.password != $scope.password2) {
      popup_noti("The passwords you entered must be the same");
      return false;
    }
    backend.doRegister($scope.username, $scope.password, function(result) {
      if (result.success) {
        popup_noti("<i>Registration successful</i>");
      } else {
        popup_noti("<span style='color:red'>Registration failed: " +
            result.reason + "</span>");
      }
    });
    $("#reg-div").fadeOut(300);
  }
}]);
