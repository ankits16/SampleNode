/* create export configuration */

//Container
var enviornments ={};

//staging (default) enviornment
enviornments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'maxChecksLimit' : 5
};

//Production
enviornments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecksLimit' : 5
};

//Determine which enviornment was passed
var currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
console.log(currentEnviornment);
// Check current enviornment is either staging or production
var enviornmentToExport = typeof(enviornments[currentEnviornment]) == 'object' ? enviornments[currentEnviornment] : enviornments.staging;
console.log(enviornmentToExport.port, enviornmentToExport.envName);
//export
module.exports =  enviornmentToExport;
