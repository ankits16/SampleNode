/* checks request handler*/

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('../config');
var tokenBasedCommonHandler = require('./tokenBasedCommonHandler');

//container
var checks = {};

//Checks : post
//Required : protocol, url, method, successCodes, timeOutSeconds
//Optional: none
checks.post = function(data, callback) {
  //validate inputs
  var protocol = (typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1) ? data.payload.protocol : false;
  var url = (typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0) ? data.payload.url.trim() : false;
  var method = (typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) ? data.payload.method : false;
  var successCodes = (typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) ? data.payload.successCodes : false;
  var timeOutSeconds = (typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5) ? data.payload.timeOutSeconds : false;

  if (protocol && url && method && successCodes && timeOutSeconds) {
    //get token for the user
    var token = typeof(data.headers.id) == 'string' ? data.headers.id : false;
    // look up user based on token
    _data.read('tokens', token, function(error, tokenData) {
      if (!error && tokenData) {
        var userPhone = tokenData.phone;
        //look up the user data
        _data.read('users', userPhone, function(error, userData) {
          if (!error && userData) {
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            //verify if user has less than max checks allowed
            if (userChecks.length < config.maxChecksLimit) {
              //create random id for the check
              var checkID = helpers.createRandomString(20);
              //create the check object and include the users phone
              var checkObject = {
                'id': checkID,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeOutSeconds': timeOutSeconds
              };

              //save to disk
              _data.create('checks', checkID, checkObject, function(error) {
                if (!error) {
                  // add the check id to the users object
                  userData.checks = userChecks;
                  userData.checks.push(checkObject);
                  _data.update('users', userPhone, userData, function(error) {
                    if (!error) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        'Error': 'Unable to add checks to the user.'
                      });
                    }
                  });
                } else {
                  callback(500, {
                    'Error': 'Could not create the new check.'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': 'User already have max number of checks (' + config.maxChecksLimit + ')'
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, {
      'Error': 'Invalid checks input'
    });
  }
};

//Checks : post
//Required : id
//Optional:
checks.get = function(data, callback) {
  //var checkID = (typeof(data.queryStringObject.checkID) == 'string' && data.queryStringObject.checkID.trim().length > 0) ? data.queryStringObject.checkID.trim() : false;
  commonTokenBoundChecksCallHandler(
    data,
    function(error, checkData){
      if(!error && checkData){
        callback(200, checkData);
      }else{
        callback(error.errorCode, {
          'Error': error.errorMessage
        });
      }
    }
  );
};

//Checks : post
//Required :id
//Optional: protocol, url, method, successCodes, timeOutSeconds one must be sent
checks.put = function(data, callback) {
  //validate inputs
  var protocol = (typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1) ? data.payload.protocol : false;
  var url = (typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0) ? data.payload.url.trim() : false;
  var method = (typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) ? data.payload.method : false;
  var successCodes = (typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) ? data.payload.successCodes : false;
  var timeOutSeconds = (typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5) ? data.payload.timeOutSeconds : false;
  var checkID = (typeof(data.queryStringObject.checkID) == 'string' && data.queryStringObject.checkID.trim().length > 0) ? data.queryStringObject.checkID.trim() : false;
  console.log(checkID , protocol, url, method, successCodes, timeOutSeconds);
  if (checkID && (protocol || url || method || successCodes || timeOutSeconds)) {
    commonTokenBoundChecksCallHandler(
      data,
      function(error, checkData){
        if(!error && checkData){
          //update check data and save
          var updatedCheckData = checkData
          if (protocol){
            updatedCheckData.protocol = protocol;
          }
          if (url){
            updatedCheckData.url = url;
          }
          if (method){
            updatedCheckData.method = method;
          }
          if (successCodes){
            updatedCheckData.successCodes = successCodes;
          }
          if (timeOutSeconds){
            updatedCheckData.timeOutSeconds = timeOutSeconds;
          }
          //save to disk
          _data.update('checks',checkID, updatedCheckData, function(error){
            console.log("~~~~~~~~~~~~~~~~~~~ updated the check");
            if(!error){
              callback(200);
            }else{
              callback(500, {
                'Error': 'Unable to update the user.'
              });
            }
          });
        }else{
          callback(error.errorCode, {
            'Error': error.errorMessage
          });
        }
      }
    );
  }else{
    callback(400, {
      'Error': 'Missing required field.'
    });
  }
};

//Checks : post
//Required : id
//Optional: none
checks.delete = function(data, callback) {
  commonTokenBoundChecksCallHandler(
    data,
    function(error, checkData){
      if(!error && checkData){
        //delete teh check
        _data.delete('checks', checkData.id, function(error){
          console.log('%%%%%%%%%%%%%%%%%%%%  check data is', checkData);
          if(!error){
            //look up user and delete check from the checks Array
            _data.read('users', checkData.userPhone, function(error, userData){
              if (!error && userData){
                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                //remove the deleted check from list of checks
                var checkPosition = userChecks.findIndex(i => i.id == checkData.id);
                if(checkPosition > -1){
                  userChecks.splice(checkPosition,1);
                  //save user data
                  _data.update('users', checkData.userPhone, userData, function(error){
                    if(!error){
                      callback(200);
                    }else{
                      callback(500, {'Error' : 'Unable to update user after deleting check.'});
                    }
                  });
                }else{
                  callback(500, {'Error' : 'Could not find the check in user checks thus not able to update the checks array.'});
                }

              }else{
                callback(500, {'Error' : 'Could not find the user who created the check thus not able to update the checks array.'});
              }
            })

          }else{
            callback(500, {'Error' : 'Unable to delete the check.'});
          }
        });
      }else{
        callback(error.errorCode, {
          'Error': error.errorMessage
        });
      }
    }
  );
};

//handles the common token bound checks request
//takes a success completion handler which will be executed if token verification goes fine
function commonTokenBoundChecksCallHandler(data, commonTaskCallback) {
  //validate input
  var checkID = (typeof(data.queryStringObject.checkID) == 'string' && data.queryStringObject.checkID.trim().length > 0) ? data.queryStringObject.checkID.trim() : false;
  if (checkID) {
    //check for
    //look up check
    _data.read('checks', checkID, function(error, checkData) {
      if (!error && checkData) {
        // verify that token is valid and belongs to the user who created the check
        console.log("###########################" + checkData.userPhone);
        tokenBasedCommonHandler.verifyTokenWithCompletionHandlers(
          data,
          checkData.userPhone,
          function(error){
            commonTaskCallback(error, checkData);
          }
        );
      } else {
        commonTaskCallback({
          errorCode : 404,
          errorMessage : '***********Check not found.'
        });
      }
    });
  } else {
    commonTaskCallback({
      errorCode : 400,
      errorMessage : '***********Invalid checks input.'
    });
  }
}

//export
module.exports = checks;
