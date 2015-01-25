app.controller("list_student_ctrl", [ "$scope", "$location", "ui",
  function($scope, $location, ui) {
    $scope.students = [ {
      user : "student",
      password : "password"
    } ];
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
