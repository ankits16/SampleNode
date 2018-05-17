/* library for storing and editing data */
/* CRUD operation*/

//Dependencies

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers')

//container for module {too be exported}
var lib = {};
//path
lib.baseDir = path.join(__dirname, '/../.data/');

//write data to file
lib.create = function(dir, file, data, callback) {
  //open the file for writing
  console.log(lib.baseDir + dir + '/' + file);
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
    console.log(err);
    commonWriteUpdateMethod(err, fileDescriptor, false, data, callback);
  });
};

//Read data
lib.read = function(dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function(error, data) {
    if (!error){
      let parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    }else{
      callback(error, data);
    }
  });
}

//Update
lib.update = function(dir, file, data, callback) {
  //open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(error, fileDescriptor) {
    commonWriteUpdateMethod(error, fileDescriptor, true, data, callback);
  });
};

// common method to handle update and write to a file
var commonWriteUpdateMethod =  function (err, fileDescriptor, isUpdate, data, callback) {
  console.log('**************** commonWriteUpdateMethod', path.join(__dirname, '/../.data/'));
  if (!err && fileDescriptor) {
    //convert data to string
    var stringData = JSON.stringify(data);
    //check if its an update
    console.log('update is ' + typeof(isUpdate));
    if (isUpdate) {
      //truncate file first
      fs.truncate(fileDescriptor, function(error) {
        if (!error) {
          //write to file
          writeToFile(fileDescriptor, stringData, callback);
        } else {
          callback('Error truncating file.');
        }
      })
    } else {
      //write to file
      writeToFile(fileDescriptor, stringData, callback);
    }
  } else {
    console.log('could not create new file');
    callback('Could not create new file');
  }
};

// write to a file
function writeToFile(fileDescriptor, stringData, callback) {
  //write to file and close it
  fs.writeFile(fileDescriptor, stringData, function(error) {
    if (!error) {
      fs.close(fileDescriptor, function(error) {
        if (!error) {
          callback(false);
        } else {
          callback('Error closing new file');
        }
      });
    } else {
      callback('Error writing new file')
    }
  });
}

//Delete
lib.delete = function(dir, file, callback) {
  //Unlink :- remove file from file system
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(error) {
    if (!error) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};

//list
lib.list = function(dir, callback){
  fs.readdir(lib.baseDir + dir +'/', function(error, data){
    if(!error && data && data.length>0){
      var trimedFileNames = [];
      data.forEach(function(fileName){
        trimedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimedFileNames);
    }else{
      callback(error, data);
    }
  });
}
//Export module
module.exports = lib;
