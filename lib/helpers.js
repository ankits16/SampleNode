/* helper for various tasks */

//Dependencies
var crypto = require('crypto');
var config = require('../config');


//Container for all helpers
var helpers = {};

//Create a SHA256 hash
helpers.hash = function(inputString){
  if (typeof(inputString) == 'string' && inputString.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(inputString).digest('hex');
    return hash;
  }else{
    return false;
  }
};

//parse JSON to an object in all cases without throwing
helpers.parseJsonToObject = function(inputString){
    try{
      var obj = JSON.parse(inputString);
      console.log(obj);
      return obj;
    }catch (e){
      console.log(e);
      return {};
    }
}

//create a random string with specified length
helpers.createRandomString = function(specifiedLength){
  specifiedLength = typeof(specifiedLength) == 'number'  && specifiedLength > 0 ? specifiedLength : false ;
  if (specifiedLength){
    //Define all the possible characters that can go in a string
    var possibleCharacter = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    //Start the final string
    var str = '';
    for (var i = 0; i <= specifiedLength; i++) {
      //get possible character
      var randonCharacter = possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));
      //append to append to final string
      str += randonCharacter;
    }
    return str;
  } else {
    return false;
  }
}

//export
module.exports = helpers;
