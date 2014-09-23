module.exports = function(env) {
  function handleGetContest(req, res) {
    req.db.collection("contests", { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({ "cid": req.data.cid }).toArray(function(err, docs) {         
        var thiscontest = docs[0];
        res.success({
          "name": thiscontest.name,
          "pids": thiscontest.problems,
          "begin": thiscontest.begin,
          "end": thiscontest.end
        });         
      });
    });
  }
  
  function handleGetContests(req, res) {
    req.db.collection("contests", { safe: true, strict: true }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({}).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        var len = docs.length;
        var name = new Array(len);
        var cid = new Array(len);
        var begin = new Array(len);
        var end = new Array(len);
        for (var i = 0; i < len; i++){
          name[i] = docs[i].name;
          cid[i] = docs[i].cid;
          begin[i] = docs[i].begin;
          end[i] = docs[i].end;
        }
        res.success({
          "length": len,
          "name": name,
          "cid": cid,
          "begin": begin,
          "end":end,
        });               
      });
    });
  }
  
  function handleAddContest(req, res) {
    if (!req.session) {
      res.resession();
      return;
    }
    if (req.session.loginLevel == 0) {
      res.fail("You need login first");
      return;
    }
    if (req.session.loginLevel == 1) {
      res.fail("You don't have privilege to add contest");
      return;
    }
    req.db.collection('contests', { safe: true, strict: true }, function(err, collection) {               
      if (err)
        throw new Error(err);
      collection.count({}, function(err, count) {
        if (err)
          throw new Error(err);
        collection.insert(
          { 
            "name": req.data.name,
            "begin": req.data.begin,
            "end": req.data.end,
            "problems": req.data.problems,
            "cid": count + 1
          },
          { safe: true },
          function(err, result) {
            if (err)
              throw new Error(err);
            res.success();
          }
        );
      });
    });
  }
  
  env.registerHandler("getContest", handleGetContest);
  env.registerHandler("getContests", handleGetContests);
  env.registerHandler("addContest", handleAddContest);
}
