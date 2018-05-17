/* handles all the token based calls */

//Dependencies
var tokens = require('./tokens');

//container
var  tokenBasedCommonHandler = {};

//validate if token is valid and blongs to the user
//
tokenBasedCommonHandler.verifyTokenWithCompletionHandlers =  function commonHandlerAfterTokenVerification(data, phone, verifyTokenCallback) {
  //get the tokens from the headers
  var token = (typeof(data.headers.id) == 'string' && data.headers.id.trim().length == 21) ? data.headers.id.trim() : false;
  //verify token
  tokens.verify(token, phone, function(isTokenValid) {
    if (isTokenValid) {
      //call valid completion handler
      verifyTokenCallback(false);
    } else {
      //call invalid token completion handler
      verifyTokenCallback({
        errorCode : 403,
        errorMessage : '***********Missing token in header or Invalid token.'
      });
    }
  });
}

//export
module.exports = tokenBasedCommonHandler;
