/*index file */

//Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

//Declare the app
var app = {};

//initialization function
app.init = function(){
  //start the server
  server.init();
  //start the workers
  workers.init();
};

//Execute
app.init();

//Exports the app
module.exports = app;
