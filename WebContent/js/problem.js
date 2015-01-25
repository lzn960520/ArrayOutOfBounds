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
        condition : "loginInfo.role=='admin' || loginInfo.role=='teacher'",
        closable : true
      });
      $location.path("/problem/add");
    }
  } ]);
app.controller("add_problem_ctrl", [
  "$scope",
  "backend",
  function($scope, backend) {
    var add_problem_session = null;
    $scope.max_cases = 10;
    $('#fileupload').fileupload(
        {
          dataType : 'json',
          type : 'POST',
          singleFileUploads : false,
          url: 'uploadcasefile',
          formData : function() {
            return [ {
              name : 'session',
              value : add_problem_session
            }, {
              name : 'max_case',
              value : $scope.max_cases
            } ];
          },
          done : function(e, data) {
            $("#add-edit-problem-modal #upload-info").text(
                'Upload test cases...');
            $("#add-edit-problem-modal #upload-btn").removeClass("disabled");
            if (data.result.missing.length == 0) {
              $("#add-edit-problem-modal #missing-files").text('nothing');
              $("#confirm-add-problem-btn").removeClass("disabled");
              $("#confirm-edit-problem-btn").removeClass("disabled");
            } else {
              $("#add-edit-problem-modal #missing-files").text(
                  data.result.missing.join(', '));
              $("#confirm-add-problem-btn").addClass("disabled");
              $("#confirm-edit-problem-btn").addClass("disabled");
            }
            add_problem_session = data.result.session;
          },
          progress : function(e, data) {
            if (data.loaded == data.total) {
              $("#add-edit-problem-modal #upload-info").text(
                  'Uploaded, processing');
              $("#add-edit-problem-modal #upload-btn").addClass("disabled");
            } else {
              $("#add-edit-problem-modal #upload-info").text(
                  (Math.round(data.loaded / data.total * 1000) / 10) + "%");
            }
          }
        });
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
          ui.popup_error("Submit code failed: " + result.reason);
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
  }).when("/problem/add", {
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
