var role_teacher = function() {}

role_teacher.prototype.granted = function(req, res) {
  switch (req.data.type) {
    case "editProblem" :
    case "addProblem" :
    case "removeProblem" :
    case "addContest" :
    case "submitCode" :
      return false;
    case "getContests" :
    case "getContest" :
    case "getProblems" :
    case "getProblem" :
    case "openSession" :
    case "login" :
    case "register" :
    case "logout" :
    case "getStudents" :
      return true;
    default :
      throw new Error("Undefined message permission");
  }
}

module.exports = role_teacher;
