/****
 * helpers for various tasks
 */
//Dependencies
var crypto = require("crypto");
var config = require("./config");
var https = require('https');
var querystring = require('querystring');

//Conatiner for all helper

var helpers = {};

helpers.hash = function (str) {
  if (typeof str == "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

//parse json into object in all cases , without throwing
helpers.parseJsonToObject = function (str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

//Create string of random alphanumeric of given length
helpers.createRandomString = function(len){
  len =typeof(len) =="number" && len>0?len:false;
  if(len){
  var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz01234789';
  var str='';
  for(i=1;i<=len;i++){
    var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length))
    str+=randomCharacter;
  }
return str;
 
}else{
  return false;
}
}

//Send sms using twillio
helpers.sendTwillioSms = function (phone,msg,callback){
       //Validation 
      var  phone = typeof phone =='string' && phone.trim().length==10?phone.trim():false;
      var  msg = typeof msg == 'string' && msg.trim().length>0 && msg.trim().length<=1600?msg.trim():false;
      if(phone && msg){
          // configure the request payload
          var payload = {
            "From":config.twilio.fromPhone,
            "To":'+91'+phone,
            "Body":msg
          }
          var stringPayload= querystring.stringify(payload);
          var requestDetails = {
            'protocol':'https:',
            'hostname':'api.twilio.com',
            'method':'POST',            
            'path':'/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth':config.twilio.accountSid+":"+config.twilio.authToken,
            'headers':{
              "content-type":"application/x-www-form-urlencoded",
              'content-length':Buffer.byteLength(stringPayload)
            }
          };
          var req = https.request(requestDetails,function(res){
            var status = res.statusCode;
            if(status ==200 || status == 201){
              callback(false);
            }else{
              callback('Status code returned was '+status);
            }
          }); 
          req.on('error',function(e){
            callback(e);
          })
         req.write(stringPayload);
         req.end();
        }else{
        callback("Given parameter were missing");
      }
};

module.exports = helpers;
