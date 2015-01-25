app.controller("header_ctrl", [ "$scope", "$location", "backend", "ui",
  function($scope, $location, backend, ui) {
    $scope.logout = function() {
      backend.doLogout(function(result) {
        if (result.success) {
          ui.popup_noti("<i>Logout successful</i>");
        } else {
          ui.popup_error("Logout failed: " + result.reason);
        }
      })
    }
  } ]);
