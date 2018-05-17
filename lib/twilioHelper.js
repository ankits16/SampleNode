/*handles Twilio related stuff*/

//Dependencies
var config = require('../lib/config');
var queryString = require('querystring');
var https = require('https');

//container
var twilioHelper = {};

//input : phone, message, callback
twilioHelper.sendTwilioSMS = function(phone, msg, callback){
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg : false;
  console.log(phone, msg);
  if (phone && msg){
    //Configure the request payload
    var payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+91'+phone,
      'Body' : msg
    }
    //configure the request details
    var stringPayload = queryString.stringify(payload);
    //configure the request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    }

    console.log(requestDetails);
    //instantiate the request object
    var req = https.request(requestDetails, function(res){
      //Grab status request
      var status = res.statusCode;
      if(status == 200 || status == 200 ){
        callback(false);
      }else{
        callback('Status code returned was ' + status);
      }
    });

    //bind to the error event so its not get thrown
    req.on('error', function(e){
      callback(e);
    });

    // add the payload
    req.write(stringPayload);

    //End the request.
    req.end();
  }else{
    callback('Missing input parameters.');
  }
}

//export
module.exports = twilioHelper;
