app.controller("list_homework_ctrl", [ "$scope", "$location", "ui", "backend",
  function($scope, $location, ui, backend) {
    $scope.homeworks = [];
    backend.getHomeworks(function(data) {
      if (data.success) {
        $scope.$apply(function() {
          $scope.homeworks = data.homeworks;
        })
      } else {
        ui.popup_error("Get homeworks failed: " + data.reason);
      }
    })
    $scope.addHomework = function() {
      ui.addTab("New homework", "/homework/add", {
        condition : "loginInfo.role=='teacher'",
        closable : true
      });
      $location.path("/homework/add");
    }
    $scope.openHomework = function(id) {
      ui.addTab(id, "/homework/" + id, {
        condition : "loginInfo.role=='student' || loginInfo.role=='teacher'",
        closable : true
      });
      $location.path("/homework/" + id);
    }
  } ]);
app.controller("single_homework_ctrl", [ "$scope", "$routeParams", "ui",
  "$location", function($scope, $routeParams, ui, $location) {
    $scope.homework = {
      id : $routeParams.id
    };
    $scope.problems = [ {
      "id" : "123",
      "name" : "xest",
    }, {
      "id" : "123",
      "name" : "uest",
    }, {
      "id" : "123",
      "name" : "vest",
    }, {
      "id" : "123",
      "name" : "west",
    } ];
    $scope.openProblem = function(id, name) {
      ui.addTab(name, "/problem/" + id, {
        closable : true
      });
      $location.path("/problem/" + id);
    }
  } ]);

app.controller("add_homework_ctrl", [
  "$scope",
  "backend",
  "ui",
  "$location",
  function($scope, backend, ui, $location) {
    $scope.name = "";
    $scope.description = "";
    $scope.begindate = new Date();
    $scope.enddate = $scope.begindate;
    $scope.begintime = new Date();
    $scope.begintime
        .setMinutes(Math.floor($scope.begintime.getMinutes() / 15) * 15);
    $scope.endtime = $scope.begintime;
    $scope.endtime.setMinutes(0);
    $scope.problems = "";
    $scope.doAddHomework = function() {
      backend.addHomework(
          $scope.name,
          $scope.description,
          $scope.begintime,
          $scope.endtime,
          $scope.problems.replace(/\s*/g, "").split(','),
          function(data) {
            if (data.success) {
              ui.popup_noti("Add homework succeeded");
              $scope.$apply(function() {
                ui.deleteTab("/homework/add");
                ui.addTab($scope.name, "/homework/" + data.hid, {
                  closable : true
                });
                $location.path("/homework/" + data.hid);
              });
            } else {
              ui.popup_error("Add homework failed: " + data.reason);
            }
          });
    }
  } ]);

app.config([ "$routeProvider", function($routeProvider) {
  $routeProvider.when("/homeworks", {
    templateUrl : "views/homework-list.html",
    controller : "list_homework_ctrl"
  }).when("/homework/add", {
    templateUrl : "views/add-homework.html",
    controller : "add_homework_ctrl"
  }).when("/homework/:id", {
    templateUrl : "views/homework-detail.html",
    controller : "single_homework_ctrl"
  })
} ]);
app.config([ "uiProvider", function(ui) {
  ui.addTab("Homeworks", "/homeworks", {
    condition : "loginInfo.role=='student' || loginInfo.role=='teacher'"
  });
} ]);
