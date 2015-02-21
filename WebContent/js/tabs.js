"use strict";

app.controller("tabs_ctrl", [
  "$scope",
  "$location",
  "ui",
  "backend",
  function($scope, $location, ui) {
    $scope.setURL = ui.setURL;
    $scope.isURL = ui.isURL;
    $scope.deleteTab = ui.deleteTab;
    $scope.$watch("loginInfo", function() {
      for (var i = 0; i < $scope.tabs.length; i++) {
        if ($scope.tabs[i].closable && !$scope.$eval($scope.tabs[i].condition))
          ui.deleteTab(i--);
      }
    }, true);
    $scope.$on("$locationChangeSuccess", function() {
      for (var i in $scope.tabs)
        if ($scope.tabs[i].url == $location.path() &&
            $scope.$eval($scope.tabs[i].condition))
          return;
      $location.path("");
    });
  } ]);
