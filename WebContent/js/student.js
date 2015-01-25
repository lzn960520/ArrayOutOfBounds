app.controller("list_student_ctrl", [ "$scope", "$location", "ui", "backend",
  function($scope, $location, ui, backend) {
    $scope.students = [];
    backend.getStudents(function(data) {
      $scope.$apply(function() {
        $scope.students = [ {
          username : data.students[0],
          password : data.students[0]
        } ];
      });
    });
  } ]);
app.config([ "$routeProvider", function($routeProvider) {
  $routeProvider.when("/students", {
    templateUrl : "views/student-list.html",
    controller : "list_student_ctrl"
  });
} ]);
app.config([ "uiProvider", function(ui) {
  ui.addTab("Students", "/students", {
    condition : "loginInfo.role=='teacher'"
  });
} ])
