var role_admin = function() {}

role_admin.prototype.granted = function(req, res) {
  switch (req.data.type) {
    case "editProblem" :
    case "addProblem" :
    case "removeProblem" :
    case "addContest" :
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
    case "getStudents" :
      return false;
    default :
      throw new Error("Undefined message permission");
  }
}

module.exports = role_admin;
