/***
 *
 * Primary file for the API
 *
 */
//Dependencies
var server = require("./lib/server");
var workers = require("./lib/workers");

//start app
var app = {};

//init app
app.init = function(){
  server.init();
  workers.init();
}
//execution 
app.init();
//export app 
module.exports = app;
