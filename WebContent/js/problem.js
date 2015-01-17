app.controller("list_problem_ctrl", [ "$scope", "$location", "ui", "backend",
  function($scope, $location, ui, backend) {
    $scope.problems = [];
    backend.getProblems(function(data) {
      $scope.problems = data.problems;
      $scope.$apply();
    });
    $scope.openProblem = function(id, name) {
      ui.addTab(name, "/problem/" + id, {
        closable : true
      });
      $location.path("/problem/" + id);
    }
    $scope.addProblem = function() {
      ui.addTab("New problem", "/problem/add", {
        condition : "login.role=='admin'",
        closable : true
      });
    }
  } ]);
app.controller("add_problem_ctrl", [ "$scope", "backend",
  function($scope, backend) {

  } ]);
app.controller("single_problem_ctrl", [
  "$scope",
  "$location",
  "$routeParams",
  "backend",
  "ui",
  function($scope, $location, $routeParams, backend, ui) {
    $scope.problem = {
      "name" : "test",
      "description" : $routeParams.id,
      "input" : "input",
      "output" : "output"
    }
    _stage = 'show';
    $scope.stage = function(stage) {
      if (stage)
        _stage = stage;
      else
        return _stage;
    }
    $scope.code = "";
    $scope.cancelSubmit = function() {
      $scope.code = "";
      _stage = "show";
    }
    $scope.confirmSubmit = function() {
      backend.submitCode($scope.code, function(result) {
        if (!result.success) {
          ui.error_noti("Submit code failed: " + result.reason);
        } else {
          if (result.score == 100) {
            ui.popup_noti("<span style='color:green'>P" + result.pid +
                ": Accepted</span>");
          } else {
            ui.popup_noti("<span style='color:yellow'>P" + result.pid + ": " +
                result.result + " " + result.score + "/100</span>");
          }
        }
      });
      $scope.code = "";
      _stage = 'show';
    }
  } ])
app.config([ "$routeProvider", function($routeProvider) {
  $routeProvider.when("/problems", {
    templateUrl : "views/problem-list.html",
    controller : "list_problem_ctrl"
  }).when("/problems/add", {
    templateUrl : "views/add-problem.html",
    controller : "add_problem_ctrl"
  }).when("/problem/:id", {
    templateUrl : "views/problem-detail.html",
    controller : "single_problem_ctrl"
  })
} ]);
app.config([ "uiProvider", function(ui) {
  ui.addTab("Problems", "/problems");
} ]);
