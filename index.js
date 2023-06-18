/***
 *
 * Primary file for the API
 *
 */

//Dependencies

var http = require("http");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./lib/config");
var https=require("https");
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require("./lib/helpers");
//var _data = require('./lib/data');


/*_data.create('test','newFile',{'foo':'bar'},function(err){
    console.log("Error is occured",err);
});
_data.read('test','newFile',function(err,data){
  console.log("Error is occured",err , "the data is",data);
});
_data.update('test','newFile',{'fixx':'dizzy'},function(err){  
  console.log("Error is occured",err);
});
_data.delete('test','newFile',function(err){
  console.log("Error in deleting",err);
})*/
//The server should respond with string
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req,res);
});

//start listen server
httpServer.listen(config.httpPort, function () {
  console.log(
    "Server start listening to " + config.httpPort);
});
httpsServerOptions={
    'key': fs.readFileSync("./https/key.pem"),
    'cert':fs.readFileSync("./https/cert.pem")
}
//The server should respond with string
var httpsServer = https.createServer(httpsServerOptions,function (req, res) {
    unifiedServer(req,res);
});

//start listen server
httpsServer.listen(config.httpsPort, function () {
  console.log(
    "Server start listening to " + config.httpsPort);
});
var unifiedServer = function (req, res) {
  var parsedUrl = url.parse(req.url, true);
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  //Get the Http method
  var method = req.method.toLowerCase();

  //Get the query string object
  var queryString = parsedUrl.query;

  //Get the headers object
  var headers = req.headers;

  //Get the payloasd if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function (data) {
    buffer += decoder.write(data);
  });
  req.on("end", function () {
    buffer += decoder.end();
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;
    var data = {
      trimmedPath: trimmedPath,
      queryString: queryString,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
      method: method,
    };
    chosenHandler(data, function (statusCode, payload) {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      payload = typeof payload === "object" ? payload : {};
      payloadString = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Return this response :", statusCode, payloadString);
    });
  });
};

//Define Router
var router = {
  'ping': handlers.ping,
  'users':handlers.users,
  'tokens':handlers.tokens,
  'checks':handlers.checks
};
