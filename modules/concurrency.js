"use strict";

module.exports = function() {
  return function() {
    var queue = [];
    function work() {
      queue[0]();
      queue.shift();
      if (queue.length !== 0)
        work();
    }
    this.run = function(callback) {
      if (queue.length !== 0) {
        queue.push(callback);
      } else {
        queue.push(callback);
        work();
      }
    };
  };
};
