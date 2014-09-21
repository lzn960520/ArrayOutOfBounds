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
  
  env.registerHandler("getContest", handleGetContest);
  env.registerHandler("getContests", handleGetContests);
}
