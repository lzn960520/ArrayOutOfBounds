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
function deleteGUI(value) {
  if ($("#tab-" + value).hasClass("selected"))
    switchGUI("welcome");
  $("#ui-" + value).remove();
  $("#tab-" + value).remove();
}
function enableTab(value) {
  $("#tab-" + value).show();
}
function disableTab(value) {
  $("#tab-" + value).hide();
  if ($("#tab-" + value).hasClass("selected"))
    switchGUI("welcome");
}
function addTab(id, name, url) {
  $("#left").append(
      "<a href='" + url + "'><div class='tab'>" + name +
          "<span class='tab-close-btn'></span>" + "</div></a>");
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
  this.tabs = [];
  this.$get = function() {
    return {
      addTab: this.addTab,
      tabs: this.tabs
    };
  };
  this.addTab = function(name, url) {
    this.tabs.push({ "url": url, "name": name });
  }
});
app.controller("tabs_ctrl", [ "$scope", "$location", "ui", function($scope, $location, ui) {
  $scope.tabs = ui.tabs;
  $scope.addTab = function(name, url) {
    $scope.tabs.push({"url":url, "name":name});
  }
  $scope.setURL = function(url) {
    $location.path(url);
  };
  $scope.isURL = function(url) {
    return $location.path() == url;
  }
}]);
