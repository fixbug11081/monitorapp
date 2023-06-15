/**
 * Request handlers
 */
//Dependencies
var _data = require("./data");
var handlers = {};
var helpers = require("./helpers");
//Define handlers

//users
handlers.users = function (data, callback) {
  var acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};
handlers._users.post = function (data, callback) {
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length >= 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;
  if (firstName && lastName && phone && password && tosAgreement) {
      
    _data.read("users", phone, function (err, data) {
      if (err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true,
          };
          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create thwe new user" });
            }
          });
        } else {
          callback(500, "Could not created hash password");
        }
      } else {
        callback(400, { Error: "A user already exist with that phone number" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};
handlers._users.get = function (data, callback) {
   
    var phone = typeof(data.queryString.phone)=='string'&&data.queryString.phone.trim().length==10?data.queryString.phone.trim():false;
    if(phone){
       var token = typeof(data.headers.token)=='string'?data.headers.token:false;
       
       handlers._tokens.verifyToken(token, phone,function(tokenIsValid){
         if(tokenIsValid){
           console.log(tokenIsValid);
          _data.read("users",phone,function(err,data){
            if(!err && data){
              delete data.hashedPassword;
              callback(200,data);
            }else{
                callback(404);
            }
        })
         }else{
           callback(403,{"Error": "Missing token in headers"});
         }
       })
      

    }else{
        callback(400, {"Error":"Missing required field"});
    }
};
handlers._users.put = function (data, callback) {
    var phone = typeof(data.payload.phone)=='string'&&data.payload.phone.trim().length==10?data.payload.phone.trim():false;
    var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

      if(phone){
           if(firstName||lastName||password){
            var token = typeof(data.headers.token)=='string'?data.headers.token:false;
            handlers._tokens.verifyToken(token, phone,function(tokenIsValid){
              if(tokenIsValid){
                console.log(tokenIsValid);
                _data.read("users",phone,function(err,userData){
                  if(!err && userData){
                     if(firstName){
                         userData.firstName = firstName;
                     }
                     if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }
                    _data.update("users",phone,userData,function(err){
                        if(!err){
                         callback(200);
                        }else{
                            console.log(err);
                            callback(500,{"Error":"The user has not been updated"})
                        }
                    });
                  }else{
                      callback(400, "The specified user does not exist");
                  }
              });
              }else{
                callback(403, {"Error":"Missing token in headers"});
              }});
              
           }else{
               callback(400, {"Error":"Missing field to update"});
           }
      }else{
          callback(400, {"Error":"Missing required field"})
      }
};
handlers._users.delete = function (data, callback) {
    var phone = typeof(data.queryString.phone)=='string'&&data.queryString.phone.trim().length==10?data.queryString.phone.trim():false;
    if(phone){
      var token = typeof(data.headers.token)=='string'?data.headers.token:false;
      handlers._tokens.verifyToken(token, phone,function(tokenIsValid){
        if(tokenIsValid){ 
          _data.read("users",phone,function(err,data){
            if(!err && data){
              _data.delete("users",phone,function(err){
                  if(!err){
                      callback(200);
                  }else{
                      callback(500,{"Error":"Could not delte the specified user"})
                  }
              })
            }else{
                callback(400,{"Error":"Could not find the specified user"});
            }
        })
        }else{
          callback(403, {"Error":"Missing token in headers"});
        }});

        

    }else{
        callback(400, {"Error":"Missing required field"});
    }
};
handlers.ping = function (data, callback) {
  callback(200);
};
handlers.notFound = function (data, callback) {
  callback(404);
};

//tokens
handlers._tokens={};
handlers.tokens = function (data, callback) {
  var acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

//tokens handles all methods
handlers._tokens.post = function(data, callback){
  var phone =
  typeof data.payload.phone == "string" &&
  data.payload.phone.trim().length >= 10
    ? data.payload.phone.trim()
    : false;
var password =
  typeof data.payload.password == "string" &&
  data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;
    if(phone && password){
       _data.read('users',phone,function(err,userData){
         if(!err && userData){
          var hashedPassword = helpers.hash(password);
          if(hashedPassword == userData.hashedPassword){
               var tokenId = helpers.createRandomString(20);
               var expires = Date.now()+1000*60*60;
               var tokenObject= {
                 'phone':phone,
                 'id':tokenId,
                 'expires':expires
               }
               _data.create('tokens', tokenId,tokenObject,function(err){
                  if(!err){
                    callback(200,tokenObject);
                  }else{
                    callback(500, {'Error':'Could not create the token'});
                  }
               })
          }else{
            callback(400, {"Error":"Password did not match"})
          }
         }else{
           callback(400,{"Error":"Could not find the user specified"});
         }
       })
    }else{
      callback(400,{"Error":"Missing required fields"})
    }
}
handlers._tokens.get = function(data, callback){
  var id = typeof(data.queryString.id)=='string'&&data.queryString.id.trim().length==20?data.queryString.id.trim():false;
    if(id){
        _data.read("tokens",id,function(err,tokenData){
            if(!err && tokenData){
              delete data.hashedPassword;
              callback(200,tokenData);
            }else{
              callback(404);
            }
        })

    }else{
        callback(400, {"Error":"Missing required field"});
    }
  
}
handlers._tokens.put = function(data, callback){
  var id =
  typeof data.payload.id == "string" &&
  data.payload.id.trim().length >= 20
    ? data.payload.id.trim()
    : false;
  var extend =
    typeof data.payload.extend == "boolean" &&
    data.payload.extend == true
      ? true
      : false;  
     if(id&&extend){
         _data.read("tokens",id,function(err,tokenData){
            if(!err && tokenData){
              if(tokenData.expires>Date.now()){
                 tokenData.expires =Date.now()+1000*60*60;
                 _data.update("tokens",id,tokenData,function(err){
                       if(!err){
                       callback(200);
                       }else{
                         console.log(err);
                         callback(500,{"Error":"Could not update the expiration"})
                       }
                 })  
              }else{

              }
            }else{
              callback(400, {'Error':"Token does not exist"});
            }
         })
     } else{
       callback(400, {'Error':'Missing required field'})
     }

}

handlers._tokens.delete = function(data, callback){
  var id = typeof(data.queryString.id)=='string'&&data.queryString.id.trim().length==20?data.queryString.id.trim():false;
    if(id){
        _data.read("tokens",id,function(err,data){
            if(!err && data){
              _data.delete("tokens",id,function(err){
                  if(!err){
                      callback(200);
                  }else{
                      callback(500,{"Error":"Could not delete the specified user token"})
                  }
              })
            }else{
                callback(400,{"Error":"Could not find the specified user token" });
            }
        })

    }else{
        callback(400, {"Error":"Missing required field"});
    }
}

//Verify token id if it is currently active for user
handlers._tokens.verifyToken = function(id,phone,callback){
  _data.read("tokens", id, function (err,tokenData){
    if(!err && tokenData){
      if(tokenData.phone == phone && tokenData.expires>Date.now()){
        callback(true);
      }else{
        callback(false);
      }
    }else{
      callback(false);
    }
  })
}

//export the handlers
module.exports = handlers;
