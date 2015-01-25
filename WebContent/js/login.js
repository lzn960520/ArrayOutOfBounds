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
app.controller("login_ctrl", [ "$scope", "backend", "ui",
  function($scope, backend, ui) {
    $scope.username = "";
    $scope.password = "";
    $scope.login = function() {
      backend.doLogin($scope.username, $scope.password, function(result) {
        if (result.success) {
          ui.popup_noti("<i>Login successful</i>");
        } else {
          ui.popup_error("Login failed: " + result.reason);
        }
      });
      $("#login-div").fadeOut(300);
    }
    $scope.register = function() {
      if ($scope.password != $scope.password2) {
        ui.popup_noti("The passwords you entered must be the same");
        return false;
      }
      backend.doRegister($scope.username, $scope.password, function(result) {
        if (result.success) {
          ui.popup_noti("<i>Registration successful</i>");
        } else {
          ui.popup_error("Registration failed: " + result.reason);
        }
      });
      $("#reg-div").fadeOut(300);
    }
  } ]);
