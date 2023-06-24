/**
 * Server related tasks
 */
//Dependencies

var http = require("http");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var https=require("https");
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require("./helpers");
var path =require('path');
var util = require('util');
var debug = util.debuglog('server');
//var _data = require('./lib/data');
var server={};
// helpers.sendTwillioSms('8527822269','hello',function(err){
//   console.log("This was the error",err);
// })

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
 server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req,res);
});


server.httpsServerOptions={
    'key': fs.readFileSync(path.join(__dirname,"/../https/key.pem")),
    'cert':fs.readFileSync(path.join(__dirname,"/../https/cert.pem"))
}
//The server should respond with string
server.httpsServer = https.createServer(server.httpsServerOptions,function (req, res) {
    server.unifiedServer(req,res);
});


server.unifiedServer = function (req, res) {
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
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;
    var data = {
      trimmedPath: trimmedPath,
      queryString: queryString,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
      method: method,
    };
    chosenHandler(data, function (statusCode, payload,contentType) {
      //Determine the type of content(fallback to json)
      contentType = typeof contentType =='string'?contentType:"json";
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      
      //Return the response to content specific
       var payloadString='';
       if(contentType =='json'){
        res.setHeader("Content-Type", "application/json");
        payload = typeof payload === "object" ? payload : {};
        payloadString = JSON.stringify(payload);
       }
       if(contentType =='html'){
        res.setHeader("Content-Type", "text/html");
        payloadString=typeof payload === "string" ? payload : '';
       }
      //Return the response to common to all content type
   
      res.writeHead(statusCode);
      res.end(payloadString);

      if(statusCode ==200){
        debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+" "+statusCode);
      }else{
        debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+" "+statusCode);
      }
      
    });
  });
};

//Define Router
server.router = {
  '':handlers.index,
  'account/create':handlers.accountCreate,
  'account/edit':handlers.accountEdit,
  'account/deleted':handlers.accountDeleted,
  'session/create':handlers.sessionCreate,
  'session/deleted':handlers.sessionDeleted,
  'checks/all':handlers.checksAll,
  'checks/create':handlers.checksCreate,
  'ping': handlers.ping,
  'api/users':handlers.users,
  'api/tokens':handlers.tokens,
  'api/checks':handlers.checks
};
server.init = function (){
    //start listen server
server.httpServer.listen(config.httpPort, function () {
  console.log('\x1b[35m%s\x1b[0m',"Server start listening to " + config.httpPort);
});
  //start listen server
server.httpsServer.listen(config.httpsPort, function () {
  console.log('\x1b[36m%s\x1b[0m', "Server start listening to " + config.httpsPort);  
});
}
module.exports=server;