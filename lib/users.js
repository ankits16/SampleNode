/* User handlers*/
// handle request to create, update, get and delete users

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var tokenBasedCommonHandler = require('./tokenBasedCommonHandler');

//container
let users = {};

//Users - post
//Required : firstName, lastName, phone, password, tosAgreement
//Optional data : none
users.post = function(data, callback) {
  //Check that all required fields are filled out
  console.log('***************** in user post');
  var firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
  var lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
  var phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10) ? data.payload.phone.trim() : false;
  var password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
  var tosAgreement = (typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true) ? true : false;
  console.log(firstName, lastName, phone, password, tosAgreement);
  if (firstName && lastName && phone && password && tosAgreement) {
    // make sure user does not already exist
    _data.read('users', phone, function(error, data) {
      if (error) {
        //Hash the password
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          //create the new users
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          };
          //strore the user
          _data.create('users', phone, userObject, function(error, data) {
            if (!error) {
              callback(200);
            } else {
              console.log('********** error user post ' + error.message);
              callback(500, {
                'Error': 'Could not create the new user.'
              })
            }
          });
        } else {
          callback(500, {
            'Error': 'Could not hash the user password.'
          })
        }
      } else {
        //user already exist
        callback(400, {
          'Error': 'User already exists'
        });
      }
    });

  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

//Users -  get
//Required : phone
//Optional : none
users.get = function(data, callback) {
  //check if phone number is  valid
  var phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10) ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //call common token bound handler
    tokenBasedCommonHandler.verifyTokenWithCompletionHandlers(
      data,
      phone,
      function(error) {
        if (!error) {
          _data.read('users', phone, function(error, data) {
            if (!error && data) {
              //remove hashed password before returning the request
              delete data.hashedPassword;
              callback(200, data);
            } else {
              callback(404);
            }
          });
        } else {
          callback(error.errorCode, {
            'Error': error.errorMessage
          });
        }
      }
    );
  } else {
    callback(400, {
      'Error': 'Missing required field.'
    });
  }
};

//Users -  put
//Required: phone
//Optional: firstName, lastName, password (at least one must be specified)
users.put = function(data, callback) {
  //check for the required fields
  var firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
  var lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
  var phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10) ? data.payload.phone.trim() : false;
  var password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
  if (phone && (lastName || firstName || password)) {
    // Lookup user
    _data.read('users', phone, function(error, userData) {
      if (!error && userData) {
        // update the fields
        if (firstName) {
          userData.firstName = firstName;
        }
        if (lastName) {
          userData.lastName = lastName;
        }
        if (password) {
          userData.hashedPassword = helpers.hash(password);
        }
        //call common token bound handler
        tokenBasedCommonHandler.verifyTokenWithCompletionHandlers(
          data,
          phone,
          function(error) {
            if (!error) {
              //write it to store
              _data.update('users', phone, userData, function(error, message) {
                if (!error) {
                  callback(200);
                } else {
                  callback(500, {
                    'Error': 'Unable to update the user.'
                  });
                }
              });
            } else {
              callback(error.errorCode, {
                'Error': error.errorMessage
              });
            }
          }
        );
      } else {
        callback(400, {
          'Error': 'User does not exist.'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field.'
    });
  }
};

//Users -  delete
//Required: phone
//Optional: none
users.delete = function(data, callback) {
  var phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10) ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //call common token bound handler
    tokenBasedCommonHandler.verifyTokenWithCompletionHandlers(
      data,
      phone,
      function(error) {
        if (!error) {
          _data.read('users',phone, function(error, userData){
            if(!error && userData){
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              //delete all userChecks
              userChecks.forEach(function(check){
                _data.delete('checks', check.id, function(errr){
                  if(error){
                    callback(500, {
                      'Error': 'Error occured while delete the checks.'
                    });
                  }
                });
              });
              //delete token
              console.log("@@@@@@@@@@@@@@ delete token", data.headers.id);
              _data.delete('tokens', data.headers.id,function(error){
                if(!error){
                  //finally delete the user
                  _data.delete('users', phone, function(error) {
                    if (!error) {
                      callback(200);
                    } else {
                      callback(400, {
                        'Error': 'Could not find the user.'
                      });
                    }
                  });
                }else{
                  callback(500, {
                    'Error': 'Unable to delete token for the user data.'
                  });
                }
              })
            }else{
              callback(500, {
                'Error': 'Unable to find user data to delete.'
              });
            }
          })

        } else {
          callback(error.errorCode, {
            'Error': error.errorMessage
          });
        }
      }
    );
  } else {
    callback(400, {
      'Error': 'Missing required field.'
    });
  }
};

//export
module.exports = users;
