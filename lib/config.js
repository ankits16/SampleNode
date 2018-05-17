/* create export configuration */

//Container
var enviornments ={};

//staging (default) enviornment
enviornments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'maxChecksLimit' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};

//Production
enviornments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecksLimit' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};

//Determine which enviornment was passed
var currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
console.log(currentEnviornment);
// Check current enviornment is either staging or production
var enviornmentToExport = typeof(enviornments[currentEnviornment]) == 'object' ? enviornments[currentEnviornment] : enviornments.staging;
console.log(enviornmentToExport.port, enviornmentToExport.envName);
//export
module.exports =  enviornmentToExport;
