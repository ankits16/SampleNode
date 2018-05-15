/* Request handlers*/

//Dependencies
var users = require('./users');
var tokens = require('./tokens');
var checks = require('./checks');

// Define all the handlers
var handlers = {};

var RequestEnum = {
  USERS : 0,
  TOKENS : 1,
  CHECKS : 2
}

//users
handlers.users = function(data, callback) {
  commonRequestHandler(RequestEnum.USERS, data, callback);
};

//tokens
handlers.tokens = function(data, callback) {
  commonRequestHandler(RequestEnum.TOKENS, data, callback);
};

//checks
handlers.checks = function(data, callback) {
  commonRequestHandler(RequestEnum.CHECKS, data, callback);
};

//Common request handler
function commonRequestHandler(requestType, data, callback){
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    switch (requestType) {
      case RequestEnum.USERS:
        users[data.method](data, callback);
        break;
      case RequestEnum.TOKENS:
        tokens[data.method](data, callback);
        break;
      case RequestEnum.CHECKS:
        checks[data.method](data, callback);
        break;
      default:
        callback(405, {'Error' : 'Undefine end point.'});
        break;
    }
  } else {
    callback(405, {'Error' : 'Undefine method.'});
  }
}

// ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

//export
module.exports = handlers;
