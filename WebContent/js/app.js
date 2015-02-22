"use strict";

var app = angular // jshint ignore:line
    .module("outofbounds", [ "ui.bootstrap", "ngRoute", "ui.ace" ]);
app.config([ "$routeProvider", function(routeProvider) {
  routeProvider.otherwise({
    redirectTo : "/welcome"
  });
} ]);
