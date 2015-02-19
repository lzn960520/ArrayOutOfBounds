"use strict";

module.exports = function(env, logger) {
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

  function handleAddHomework(req, res) {
    req.db.collection("homeworks", {
      safe : true,
      strict : true
    }, function(err, homeworks) {
      if (err)
        throw new Error(err);
      homeworks.count({}, function(err, count) {
        if (err)
          throw new Error(err);
        var newhid = (count + 1).toString();
        homeworks.insert({
          "name" : req.data.name,
          "description" : req.data.description,
          "begintime" : req.data.begintime,
          "endtime" : req.data.endtime,
          "problems" : req.data.problems,
          "hid" : newhid
        }, function(err, result) {
          if (err)
            throw new Error(err);
          req.db.collection("users", {
            safe : true,
            strict : true
          }, function(err, users) {
            if (err) {
              homeworks.remove({
                _id : result.ops[0]._id
              }, function(err2) {
                if (err2)
                  throw new Error(err2);
                throw new Error(err);
              });
            }
            users.update({
              username : req.session.username
            }, {
              $addToSet : {
                "homeworks" : {
                  $ref : "homeworks",
                  $id : result.ops[0]._id
                }
              }
            }, function(err) {
              if (err) {
                homeworks.remove({
                  _id : result.ops[0]._id
                }, function(err2) {
                  if (err2)
                    throw new Error(err2);
                  throw new Error(err);
                });
              }
              res.success({
                hid : newhid
              });
            });
          })
        });
      });
    });
  }

  function handleGetHomeworks(req, res) {
    switch (req.session.role) {
      case "teacher" :
        req.db.collection("users", {
          safe : true,
          strict : true
        }, function(err, users) {
          if (err)
            throw new Error(err);
          users.find({
            username : req.session.username
          }, {
            _id : 0,
            homeworks : 1
          }).toArray(function(err, docs) {
            if (err)
              throw new Error(err);
            docs = docs[0].homeworks;
            logger.debug(docs);
            env.modules.helper.dereferenceArray(docs, function(err) {
              if (err)
                throw new Error(err);
              logger.debug(docs);
              res.success({
                homeworks : docs
              });
            });
          });
        });
        break;
      case "student" :
        break;
    }
  }
  env.registerHandler("getStudents", handleGetStudents);
  env.registerHandler("addHomework", handleAddHomework);
  env.registerHandler("getHomeworks", handleGetHomeworks);
};
