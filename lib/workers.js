/**
 * Workers related tasks
 */
var fs = require('fs');
var https=require('https');
var http=require('http');
var url =require('url');
var path = require('path');
var _data = require("./data");
var helpers = require("./helpers");
var _logs = require("./logs");
var util = require('util');
var debug = util.debuglog('workers');

var workers ={};
workers.gatherAllChecks = function (){
    _data.list('checks', function(err,checks){
        if(!err && checks && checks.length>0){
          checks.forEach(function (check){
              _data.read('checks',check,function(err,originalCheckData){
                      if(!err && originalCheckData){
                       workers.validateCheckData(originalCheckData);
                      }else{
                          debug("Err in logging data");
                      }
              });
          })
        }else{
            debug("Error:Could not find the check to process")
        }
    })
}

workers.validateCheckData =function(originalCheckData){
    originalCheckData = typeof originalCheckData =='object' && originalCheckData!=null?originalCheckData:{};
    originalCheckData.id = typeof originalCheckData.id=='string'&& originalCheckData.id.trim().length==20 ? originalCheckData.id:false;
    originalCheckData.userPhone = typeof originalCheckData.userPhone=='string'&& originalCheckData.userPhone.trim().length==10 ? originalCheckData.userPhone:false;
    originalCheckData.protocol = typeof originalCheckData.protocol=='string'&& ['http','https'].indexOf(originalCheckData.protocol)>-1 ? originalCheckData.protocol:false;
    originalCheckData.url = typeof originalCheckData.url=='string'&& originalCheckData.url.trim().length>0 ? originalCheckData.url:false;
    originalCheckData.method = typeof originalCheckData.method=='string'&&['get','post','put','delete'].indexOf(originalCheckData.protocol) ? originalCheckData.method:false;
    originalCheckData.successCodes = typeof originalCheckData.successCodes=='object'&&originalCheckData.successCodes instanceof Array&& originalCheckData.successCodes.length>0? originalCheckData.successCodes:false;
    originalCheckData.timeoutSeconds = typeof originalCheckData.timeoutSeconds=='number'&&originalCheckData.timeoutSeconds%1==0&&originalCheckData.timeoutSeconds>1 && originalCheckData.timeoutSeconds<5?originalCheckData.timeoutSeconds:false;
    originalCheckData.state = typeof originalCheckData.state=='string'&& ['up','down'].indexOf(originalCheckData.state)>-1 ? originalCheckData.state:'down';
    originalCheckData.lastChecked = typeof originalCheckData.lastChecked=='number'&&originalCheckData.lastChecked%1==0?originalCheckData.lastChecked:false;
    if(originalCheckData.id &&
        originalCheckData.userPhone&&
        originalCheckData.protocol&&
        originalCheckData.url&&
        originalCheckData.method&&
        originalCheckData.successCodes&&
        originalCheckData.timeoutSeconds)
        {
            
           workers.performCheck(originalCheckData);

        }else{
            debug(originalCheckData);
            debug("Worker is not formatted properly");
        }   
       
}

workers.performCheck = function (originalCheckData){
        var checkOutcome = {
            'error':false,
            'responseCode':false
        }  
        
        var outcomeSent=false;
        var parsedUrl = url.parse(originalCheckData.protocol+"://"+originalCheckData.url,true);
        var hostName = parsedUrl.hostname;
        var path = parsedUrl.path;

        var requestDetails= {
          'protocol':originalCheckData.protocol+":",
          'hostname':hostName,
          'method':originalCheckData.method.toUpperCase(),
          'path':path,
          'timeout':originalCheckData.timeoutSeconds*1000
        }

        var _moduleToUse = originalCheckData.protocol == 'http'?http:https;
        var req = _moduleToUse.request(requestDetails,function(res){
        var status = res.statusCode;  
        checkOutcome.responseCode=status;
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }  
        });

        req.on('error', function (e){
            checkOutcome.error = {
             'error':true,
             'value':e
            }
            if(!outcomeSent){
                workers.processCheckOutcome(originalCheckData,checkOutcome);
                outcomeSent = true;
            }
        })
        req.on('timeout', function (e){
            checkOutcome.error = {
             'error':true,
             'value':'timeout'
            }
            if(!outcomeSent){
                workers.processCheckOutcome(originalCheckData,checkOutcome);
                outcomeSent = true;
            }
        });
        req.end();

}
workers.processCheckOutcome = function(originalCheckData,checkOutcome){
 var state = !checkOutcome.error&&checkOutcome.responseCode&&originalCheckData.successCodes.indexOf(checkOutcome.responseCode)>-1?'up':'down';
 var alertWarrented = originalCheckData.lastChecked&&originalCheckData.state!==state?true:false;

 //log the outcome after checks
 var timeOfCheck = Date.now();
 workers.log(originalCheckData, checkOutcome,alertWarrented,state,timeOfCheck);

 var newCheckData = originalCheckData;
 newCheckData.state=state;
 newCheckData.lastChecked=timeOfCheck;

 _data.update('checks', newCheckData.id,newCheckData, function(err){
     
     if(!err){
         
               if(!alertWarrented){
                workers.alertUserToStatusChange(newCheckData);
               }else{
                  debug("checkoutcome has not changed , no need to alert");  
               }
     }else{
       debug("Error in trying to update the checks");
     }
 })

}
workers.alertUserToStatusChange=function(newCheckData){
    var msg = "Alert: You check for "+newCheckData.method.toUpperCase()+" "+newCheckData.protocol+"://"+newCheckData.url+" is currently "+newCheckData.state;
    helpers.sendTwillioSms(newCheckData.userPhone,msg,function(err){
        if(!err){
            debug("Success:User has been alerted to status change in their check via sms",msg);
        }else{
            debug("Error:Could not find any checks to process");
        }
    }) 
}  

workers.log = function (originalCheckData, checkOutcome,alertWarrented,state,timeOfCheck){
    var logData = {
          'check':originalCheckData,
          'outcome':checkOutcome,
          'state':state,
          'alert':alertWarrented,
          'time':timeOfCheck
      }
      logString = JSON.stringify(logData);
      var logFileName = originalCheckData.id;
      _logs.append(logFileName, logString, function (err){
          if(!err){
              debug("logging file is succeeded");
          }else{
              debug("logging file is failed");
          }
      })
}
//compress the logs file
workers.rotateLogs = function (){
    _logs.list(false, function(err,logs){
       if(!err && logs && logs.length>0){
          logs.forEach(function (logName){
              var logId = logName.replace(".log","");
              var newFileId = logId+"-"+Date.now();
              _logs.compress(logId,newFileId, function(err){
                 if(!err){
                       _logs.truncate(logId, function (err){
                           if(!err){
                               debug("Success trancating logs");
                           }else{
                               debug("Failed to trucate log");
                           }
                       })
                 }else{
                     debug("Error:Compressing the file got err",err)
                 }
              })
          })
       }else{
          debug("Error: Could not rotate the logs");
       }
    })
}
//Timers to execute log rotation process once per day
workers.logRotationLoop = function(){
    setInterval(function (){
        workers.rotateLogs();
       },1000*60*60*24);
}
workers.loop = function(){
    setInterval(function (){
     workers.gatherAllChecks();
    },1000*60);
}
workers.init = function (){

    //send to console in yellow
    console.log('\x1b[33m%s\x1b[0m','Background workers are running');
    workers.gatherAllChecks();
    workers.loop();
    //compress all the logs immediately
    workers.rotateLogs();
    //call the compression loop to log
    workers.logRotationLoop();
}

module.exports = workers;