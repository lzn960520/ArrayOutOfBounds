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
  var notimanager = function() {
    var POPUP_TIMEOUT = 3000;
    var FADE_DURATION = 300;
    var notitop = 70;
    var playing = false;
    var queue = 0;
    function anim() {
      playing = true;
      queue--;
      var height = $(".noti:first").outerHeight() + 10;
      $(".noti:first").fadeOut(FADE_DURATION, function() {
        $(".noti:first").remove("");
        notitop -= height;
        if ($(".noti").length == 0)
          playing = false;
        else
          $(".noti").animate({
            top : "-=" + height + "px"
          }, "fast", function() {
            if (queue != 0) {
              queue--;
              anim();
            } else
              playing = false;
          });
      });
    }
    function popout() {
      queue++;
      if (!playing)
        anim();
    }
    this.popup = function(message) {
      var noti = '<div class="noti" style="display:none;position:fixed;top:' +
          notitop + 'px;right:1%">' + message + '</div>';
      $("body").append(noti);
      notitop += $(".noti:last").outerHeight() + 10;
      $(".noti:last").fadeIn(FADE_DURATION);
      setTimeout(popout, POPUP_TIMEOUT);
    }
    return this;
  }();
  this.$get = [ "$location", function($location) {
    return {
      addTab : this.addTab,
      deleteTab : function(index) {
        if (that.tabs[index].url == $location.path())
          $location.path("");
        that.deleteTab(index);
      },
      setURL : function(url) {
        $location.path(url);
      },
      isURL : function(url) {
        return url == $location.path();
      },
      tabs : that.tabs,
      login : that.login,
      popup_noti : that.popup_noti,
      error_noti : that.error_noti
    };
  } ];
  this.addTab = function(name, url, options) {
    options = options || {};
    for (i in this.tabs)
      if (this.tabs[i].url == url)
        return;
    this.tabs.push({
      "url" : url,
      "name" : name,
      "closable" : options.closable === true ? true : false,
      "condition" : options.condition || "true"
    });
  }
  this.deleteTab = function(index) {
    this.tabs.splice(index, 1);
  }
  this.popup_noti = notimanager.popup;
  this.error_noti = function(noti) {
    this.popup_noti("<span style='color:red'>" + noti + "</span>");
  }
});
app.controller("tabs_ctrl", [
  "$scope",
  "$location",
  "ui",
  "backend",
  function($scope, $location, ui, backend) {
    $scope.tabs = ui.tabs;
    $scope.setURL = ui.setURL;
    $scope.isURL = ui.isURL;
    $scope.deleteTab = ui.deleteTab;
    $scope.$watch("loginInfo", function() {
      for (i = 0; i < $scope.tabs.length; i++) {
        if ($scope.tabs[i].closable && !$scope.$eval($scope.tabs[i].condition))
          ui.deleteTab(i--);
      }
    }, true);
    $scope.$on("$locationChangeSuccess", function(e) {
      for (i in $scope.tabs)
        if ($scope.tabs[i].url == $location.path() &&
            $scope.$eval($scope.tabs[i].condition))
          return;
      $location.path("");
    })
  } ]);
app.controller("header_ctrl", [
  "$scope",
  "$location",
  "backend",
  function($scope, $location, backend) {
    $scope.logout = function() {
      backend.doLogout(function(result) {
        if (result.success) {
          popup_noti("<i>Logout successful</i>");
        } else {
          popup_noti("<span style='color:red'>Logout failed: " + result.reason +
              "</span>");
        }
      })
    }
  } ]);
