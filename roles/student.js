var role_user = function() {
}

role_user.prototype.granted = function(req, res) {
  switch (req.data.type) {
  case "editProblem":
  case "addProblem":
  case "removeProblem":
  case "addContest":
    return false;
    break;
  case "submitCode":
  case "getContests":
  case "getContest":
  case "getProblems":
  case "getProblem":
  case "openSession":
  case "login":
  case "register":
  case "logout":
    return true;
    break;
  default:
    throw new Error("Undefined message permission");
  }
}

module.exports = role_user;