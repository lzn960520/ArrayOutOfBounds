var editor_session = {};
function switchNAV(value) {
  if (value == 0) {
    $("#header #before-login").css("display", "inline-block");
    $("#header #after-login").css("display", "none");
  } else {
    $("#header #before-login").css("display", "none");
    $("#header #after-login").css("display", "inline-block");
  }
}
function isNAV(value) {
  if ($("#header #before-login").css("display") != "none")
    return value == 0;
  else
    return value == 1;
}
function showConfirm(title, content, yescallback, nocallback, yesclass, noclass) {
  $("#confirm-modal #title").html(title);
  $("#confirm-modal #content").html(content);
  $("#confirm-modal #yes-btn").click(function() {
    if (yescallback)
      yescallback();
  });
  $("#confirm-modal #no-btn").click(function() {
    if (nocallback)
      nocallback();
  });
  $("#confirm-modal #yes-btn").removeClass();
  $("#confirm-modal #yes-btn").addClass("btn " + (yesclass || "btn-default"));
  $("#confirm-modal #no-btn").removeClass();
  $("#confirm-modal #no-btn").addClass("btn " + (noclass || "btn-default"));
  $("#confirm-modal").modal();
}
$(function() {
  $(".popup").hide();
  $(".ui").hide();
  $("body").delegate(".tab-close-btn", "click", function(e) {
    deleteGUI(e.currentTarget.parentElement.id.substring(4));
    e.stopPropagation();
  });
});
app.provider("ui", function() {
  var that = this;
  this.tabs = [];
  this.$get = [ "$location", function($location) {
    return {
      addTab: this.addTab,
      deleteTab: function(index) {
        if (that.tabs[index].url == $location.path())
          $location.path("/");
        that.deleteTab(index);
      },
      setURL: function(url) {
        $location.path(url);
      },
      isURL: function(url) {
        return url == $location.path();
      },
      tabs: that.tabs,
      login: that.login,
    };
  }];
  this.addTab = function(name, url, options) {
    options = options || {};
    for (i in this.tabs)
      if (this.tabs[i].url == url)
        return;
    this.tabs.push({ "url": url, "name": name, "closable": options.closable===true ? true : false, "condition": options.condition || "true" });
  }
  this.deleteTab = function(index) {
    this.tabs.splice(index, 1);
  }
});
app.controller("tabs_ctrl", [ "$scope", "$location", "ui", "backend", function($scope, $location, ui, backend) {
  $scope.tabs = ui.tabs; 
  $scope.setURL = ui.setURL;
  $scope.isURL = ui.isURL;
  $scope.deleteTab = ui.deleteTab;
  $scope.login = backend.login;
  backend.loginNotifier.then(null, null, function(login) {
    $scope.login = login;
  })
}]);
app.controller("header_ctrl", [ "$scope", "backend", function($scope, backend) {
  $scope.login = backend.login;
  $scope.logout = function() {
    backend.doLogout(function() {
      if (result.success) {
        popup_noti("<i>Logout successful</i>");
      } else {
        popup_noti("<span style='color:red'>Logout failed: " + result.reason +
            "</span>");
      }
    })
  }
  backend.loginNotifier.then(null, null, function(login) {
    $scope.login = login;
  })
}]);
