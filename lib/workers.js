/*worker related tasks*/

//Dependendies
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var _data = require('./data');
var helpers = require('../lib/helpers');
var twilioHelper = require('./twilioHelper');
var url = require('url');

//Container
var workers = {};

//gather all checks and send it to validator
workers.gatherAllChecks = function() {
  console.log("********************** check gathering initiated");
  //get all checcks
  _data.list('checks', function(error, checks) {
    console.log(checks);
    if (!error && checks && checks.length > 0) {
      checks.forEach(function(check) {
        //read the check
        _data.read('checks', check, function(error, checkData) {
          if (!error, checkData) {
            //pass to the validator
            workers.validateCheckData(checkData);
          } else {
            console.log("[Error]- error reading check data ");
          }
        });
      });
    } else {
      console.log("[Error]- could not find checks");
    }
  });
};

//sanity checking the check data
workers.validateCheckData = function(originalCheckData) {
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 21 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds <= 5 ? originalCheckData.timeOutSeconds : false;
  // Set the keys that may not be set (if the workers have never seen this check before)
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;
  console.log(originalCheckData.id,
  originalCheckData.userPhone,
  originalCheckData.protocol,
  originalCheckData.url,
  originalCheckData.method ,
  originalCheckData.successCodes,
  originalCheckData.timeOutSeconds);

  if(originalCheckData.id &&
  originalCheckData.userPhone &&
  originalCheckData.protocol &&
  originalCheckData.url &&
  originalCheckData.method &&
  originalCheckData.successCodes &&
  originalCheckData.timeOutSeconds){
    workers.performCheck(originalCheckData);
  } else {
    // If checks fail, log the error and fail silently
    console.log("Error: one of the checks is not properly formatted. Skipping.");
  }
};

//perform the check, send the origibal data and outcome to next process

workers.performCheck = function(originalCheckData){
  //original check out come
  var checkOutcome = {
    'error' : false,
    'responseCode': false
  };

  //mark that the outcome has not been set
  var outcomeSent = false;

  //parse the hostname and the pathout of the orifinal check data
  var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path; // Using path not pathname because we want the query string

  //Construct the request
  var requestDetails = {
    'protocol' : originalCheckData.protocol+':',
    'hostname' : hostName,
    'method' : originalCheckData.method.toUpperCase(),
    'path' : path,
    'timeout' : originalCheckData.timeOutSeconds * 1000
  };

  // Instantiate the request object (using either the http or https module)
  var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  var req = _moduleToUse.request(requestDetails, function(res){
    // Grab the status of the sent request
      var status =  res.statusCode;
      // Update the checkOutcome and pass the data along
      checkOutcome.responseCode = status;
      if(!outcomeSent){
        workers.processCheckOutcome(originalCheckData,checkOutcome);
        outcomeSent = true;
      }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', function(e){
    // Update the checkOutcome and pass the data along
   checkOutcome.error = {'error' : true, 'value' : e};
   if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout',function(){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {'error' : true, 'value' : 'timeout'};
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();
};

// Process the check outcome, update the check data as needed, trigger an alert if needed
workers.processCheckOutcome = function(originalCheckData,checkOutcome){
  // Decide if the check is considered up or down
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
  // Decide if an alert is warranted
  var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
  // Update the check data
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, function(error){
    if(!error){
      // Send the new check data to the next phase in the process if needed
      if(alertWarranted){
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed, no alert needed");
      }
    }else{
      console.log("Error trying to save updates to one of the checks");
    }
  });
};

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
  var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
  twilioHelper.sendTwilioSMS(newCheckData.userPhone,msg,function(err){
    if(!err){
      console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
    } else {
      console.log("Error: Could not send sms alert to user who had a state change in their check",err);
    }
  });
};

//Timer to execute the worker-process once per minute
workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks();
  }, 1000 * 10);
};

//init
workers.init = function(){
  //execute all the checks
  workers.gatherAllChecks();
  // call the loop so the checcks will execute later on
  workers.loop();
};

//export
module.exports = workers;
