app.controller("list_homework_ctrl", [ "$scope", "$location", "ui", function($scope, $location, ui) {
  $scope.homeworks = [
    {
      id: "CS2010",
      begintime: new Date(),
      endtime: new Date(),
      score: 60,
      fullscore: 100
    }
  ];
  $scope.openHomework = function(id) {
    ui.addTab(id, "/homework/" + id, { closable: true });
    $location.path("/homework/" + id);
  }
}]);
app.controller("single_homework_ctrl", [ "$scope", "$routeParams", "ui", "$location", function($scope, $routeParams, ui, $location) {
  $scope.homework = {
    id: $routeParams.id
  };
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
app.config(["$routeProvider", function($routeProvider) {
  $routeProvider
    .when("/homeworks", {
      templateUrl: "views/homework-list.html",
      controller: "list_homework_ctrl"
    })
    .when("/homework/:id", {
      templateUrl: "views/homework-detail.html",
      controller: "single_homework_ctrl"
    })
}]);
app.config(["uiProvider", function(ui) {
  ui.addTab("Homeworks", "/homeworks", { condition: "login.role=='student'" });
}])