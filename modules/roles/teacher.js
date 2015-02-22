"use strict";

var role_teacher = function() {};

role_teacher.prototype.granted = function(req) {
  switch (req.data.type) {
    case "addContest" :
    case "submitCode" :
      return false;
    case "removeProblem" :
    case "editProblem" :
    case "addProblem" :
    case "getContests" :
    case "getContest" :
    case "getProblems" :
    case "getProblem" :
    case "openSession" :
    case "login" :
    case "register" :
    case "logout" :
    case "getStudents" :
    case "addHomework" :
    case "getHomeworks" :
      return true;
    default :
      throw new Error("Undefined message permission");
  }
};

module.exports = role_teacher;
