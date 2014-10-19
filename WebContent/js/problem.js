app.controller("list_problem_ctrl", ["$scope", "$location", "ui", function($scope, $location, ui) {
  $scope.problems = [
    {
      "id": "123",
      "name": "xest",
    }, {
      "id": "123",
      "name": "uest",
    }, {
      "id": "123",
      "name": "vest",
    }, {
      "id": "123",
      "name": "west",
    }
  ];
  $scope.openProblem = function(id, name) {
    ui.addTab(name, "/problem/" + id, { closable: true });
    $location.path("/problem/" + id);
  }
}]);
app.controller("single_problem_ctrl", ["$scope", "$location", "$routeParams", function($scope, $location, $routeParams) {
  $scope.problem = {
    "name": "test",
    "description": $routeParams.id,
    "input": "input",
    "output": "output"
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
    $scope.code = "";
    _stage = 'show';
  }
}])
app.config(["$routeProvider", function($routeProvider) {
  $routeProvider
    .when("/problems", {
      templateUrl: "views/problem-list.html",
      controller: "list_problem_ctrl"
    })
    .when("/problem/:id", {
      templateUrl: "views/problem-detail.html",
      controller: "single_problem_ctrl"
    })
}]);
app.config(["uiProvider", function(ui) {
  ui.addTab("Problems", "/problems");
}]);
