"use strict";

var role_user = function() {};

role_user.prototype.granted = function(req) {
  switch (req.data.type) {
    case "editProblem" :
    case "addProblem" :
    case "removeProblem" :
    case "addContest" :
    case "getStudents" :
      return false;
    case "submitCode" :
    case "getContests" :
    case "getContest" :
    case "getProblems" :
    case "getProblem" :
    case "openSession" :
    case "login" :
    case "register" :
    case "logout" :
      return true;
    default :
      throw new Error("Undefined message permission");
  }
};

module.exports = role_user;
