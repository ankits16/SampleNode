/* Token related request handling*/
// handle request to create, update, get and delete tokens

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');

//container
var token = {};

//Tokens: post
//Required : phone, password
//Optional : none
token.post = function(data, callback) {
  var phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10) ? data.payload.phone.trim() : false;
  var password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
  if (phone && password) {
    //look up the user who matches the phone number
    _data.read('users', phone, function(error, userData) {
      if (!error && userData) {
        //Hash the send password and compare with stored password
        var hashPassword = helpers.hash(password);
        if (hashPassword == userData.hashedPassword) {
          //if valid create a new token with a random name. Set expiration date 1 hour
          var tokenID = helpers.createRandomString(20);
          if (tokenID){
            var expires = Date.now() + 1000 * 60 * 60;
            var tokenObject = {
              'phone': phone,
              'id': tokenID,
              'expires': expires
            };

            //Store the token
            _data.create('tokens', tokenID, tokenObject, function(error) {
              if (!error) {
                callback(200, tokenObject);
              } else {
                callback(500, {
                  'Error': 'Could not create a new token'
                })
              }
            });
          }else{
            // could not generate the token
            callback(500, {
              'Error': 'Unable to generate token'
            })
          }
        } else {
          callback(400, {
            'Error': 'Password mismatch'
          });
        }
      } else {
        callback(400, {
          'Error': 'Could not find the user'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

//Tokens: get
//Required : id
//Optional : none
token.get = function(data, callback) {
  //check if phone number is  valid
  var id = (typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 21) ? data.queryStringObject.id.trim() : false;
  if (id){
    _data.read('tokens', id, function(error, tokenData){
      if(!error && tokenData){
        callback(200, tokenData);
      }else{
        callback(404);
      }
    });
  }else{
    callback(400, {'Error': 'Missing required field.'});
  }
};

//Tokens: put
//Required : id, extend = true
//Optional : none
token.put = function(data, callback) {
  var id = (typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 21) ? data.payload.id.trim() : false;
  var extend = (typeof(data.payload.extend) == 'boolean' && data.payload.extend == true) ? true : false;
  if (id && extend){
    //look up the token
    _data.read('tokens', id, function(error, tokenData){
      if(!error && tokenData){
        //check to make sure that token is not expired
        if (tokenData.expires > Date.now()){
          //set the expiration from an from now
          tokenData.expires = Date.now() +  1000*60*60;
          //save token data
          _data.update('tokens', id, tokenData, function(error){
            if(!error){
              callback(200);
            }else {
              callback(500, {
                'Error': 'Unable to extend token expiry'
              });
            }
          });
        }else{
          callback(400, {
            'Error': 'Token Expired'
          });
        }
      }else{
        callback(400, {
          'Error': 'Token not found.'
        });
      }
    });
  }else{
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

//Tokens: delete
//Required : idea
//Optional :none
token.delete = function(data, callback) {
  var id = (typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 21) ? data.queryStringObject.id.trim() : false;
  if (id){
    _data.delete('tokens', id, function(error){
      if(!error){
        callback(200);
      }else{
        callback(400, {'Error': 'Could not find the id.'});
      }
    });
  }else{
    callback(400, {'Error': 'Missing required field.'});
  }
};

//verify tokens
token.verify = function(id, phone, callback){
  //lookup the token
  _data.read('tokens', id, function(error, tokenData){
    if (!error && tokenData){
      // Check token is for give user and not Expired
      if (tokenData.phone == phone && tokenData.expires >= Date.now()){
        callback(true);
      }else{
        callback(false);
      }
    }else{
      callback(false);
    }
  });
};


//export
module.exports = token;
