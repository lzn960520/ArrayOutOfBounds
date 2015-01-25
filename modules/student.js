module.exports = function(env) {
  function handleGetStudents(req, res) {
    req.db.collection("users", {
      safe : true,
      strict : true
    }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({
        "username" : req.session.username
      }, {
        "students" : 1,
        "_id" : 0,
      }).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        res.success(docs[0]);
      });
    });
  }

  env.registerHandler("getStudents", handleGetStudents);
}
