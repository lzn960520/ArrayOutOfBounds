var app = angular.module("outofbounds", [ "ui.bootstrap", "ngRoute", "ui.ace" ]);
app.config(["$routeProvider", function(routeProvider) {
  routeProvider.otherwise({redirectTo: '/welcome'});
}]);