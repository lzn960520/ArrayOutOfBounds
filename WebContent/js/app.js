var app = angular.module("outofbounds", [ "ui.bootstrap", "ngRoute" ]);
app.config(["$routeProvider", function(routeProvider) {
  routeProvider.otherwise({redirectTo: '/welcome'});
}]);