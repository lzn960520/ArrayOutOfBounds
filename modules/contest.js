"use strict";

module.exports = function(env) {
  function handleGetContest(req, res) {
    req.db.collection("contests", {
      safe : true,
      strict : true
    }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({
        "cid" : req.data.cid
      }).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        var thiscontest = docs[0];
        res.success({
          "name" : thiscontest.name,
          "pids" : thiscontest.problems,
          "begin" : thiscontest.begin,
          "end" : thiscontest.end
        });
      });
    });
  }

  function handleGetContests(req, res) {
    req.db.collection("contests", {
      safe : true,
      strict : true
    }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.find({}, {
        "problems" : 0,
        "_id" : 0
      }).toArray(function(err, docs) {
        if (err)
          throw new Error(err);
        res.success({
          "length" : docs.length,
          "contests" : docs
        });
      });
    });
  }

  function handleAddContest(req, res) {
    req.db.collection("contests", {
      safe : true,
      strict : true
    }, function(err, collection) {
      if (err)
        throw new Error(err);
      collection.count({}, function(err, count) {
        if (err)
          throw new Error(err);
        collection.insert({
          "name" : req.data.name,
          "begin" : req.data.begin,
          "end" : req.data.end,
          "problems" : req.data.problems,
          "cid" : count + 1
        }, {
          safe : true
        }, function(err) {
          if (err)
            throw new Error(err);
          res.success();
        });
      });
    });
  }

  env.registerHandler("getContest", handleGetContest);
  env.registerHandler("getContests", handleGetContests);
  env.registerHandler("addContest", handleAddContest);
};
