/****
 * helpers for various tasks
 */
//Dependencies
var crypto = require("crypto");
var config = require("./config");

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
module.exports = helpers;
