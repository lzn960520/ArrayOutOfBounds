"use strict";

module.exports = function() {
  return function() {
    var queue = [];
    this.exit = function() {
      queue.shift();
      if (queue.length !== 0)
        setTimeout(0, queue[0]);
    };
    this.run = function(callback) {
      if (queue.length !== 0) {
        queue.push(callback);
      } else {
        queue.push(callback);
        queue[0]();
      }
    };
  };
};
