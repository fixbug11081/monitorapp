/**
 * library for storing and  rotating logs
 * 
 */
//Dependencies
var path = require('path');
var zlib = require('zlib');
var fs =require('fs');
//container for the module
var lib ={};

lib.baseDir = path.join(__dirname,'/../.logs/');
//Append a string to file  if not exist then create

lib.append = function (file,str,callback){
    
  fs.open(lib.baseDir+file+'.log','a', function (err,fileDescriptor){
      if(!err && fileDescriptor){
          fs.appendFile(fileDescriptor, str+'\n',function(err){
                  if(!err){
                     fs.close(fileDescriptor, function (err){
                        if(!err){
                          callback(false);
                        }else{
                          callback("Error in closing the file")
                        }
                     })
                  }else{
                      callback("Could not append file")
                  }
          });     
      }else{
          callback("Could not open file for appending");
      }
  })  
}
lib.list = function (includeCommpressedlogs, callback){
  fs.readdir(lib.baseDir, function(err,data){
    if(!err && data && data.length>0){
         var trimmedFileNames=[];
         data.forEach(function(fileName){
               if(fileName.indexOf(".log")>-1){
                trimmedFileNames.push(fileName.replace(".log",""));
               }
               if(fileName.indexOf('.gz.b64')>-1)
               {
                trimmedFileNames.push(fileName.replace(".gz.b64",""));
               }
               callback(false,trimmedFileNames);
         })
    }else{
         callback(err,data);
    }
  })
}
//compress the one file from .log to .gz with in ssame dir
lib.compress = function (logId, newFileId,callback){
  var sourceFile = logId+".log";
  var destFile = newFileId+".gz.b64";

  fs.readFile(lib.baseDir+sourceFile, 'utf8', function (err,inputString){
    if(!err&&inputString){
          zlib.gzip(inputString, function(err,buffer){
            if(!err && buffer){
             fs.open(lib.baseDir+destFile,'wx',function(err,fileDescriptor){
                if(!err && fileDescriptor){
                  fs.writeFile(fileDescriptor, buffer.toString('base64'),function(err){
                    if(!err){
                     fs.close(fileDescriptor, function(){
                       if(!err){
                         callback(false);
                       }else{
                         callback(err);
                       }
                     })
                    }else{
                       callback(err);
                    }
                  })
                }else{
                  callback(err);
                }
             })
            }else{
              callback(err);
            }
          })
    }else{

    }
  })
}
//Decompress the content from .gz.b64 to string variable
lib.decompress = function (fileId , callback){
  var fileName = fileId+"gz.b64";
  fs.readFile(lib.baseDir+fileName,utf8, function(err,str){
    if(!err && str){
    var inputBuffer = Buffer.from(str,'base64');
    zlib.unzip(inputBuffer, function(err,outputBuffer){
      if(!err && outputBuffer){
          var str = outputBuffer.toString();
          callback(false,str);
      }else{
        callback(err);
      }
    })
    }else{
      callback(err);
    }
    
  })

}
//Truncate the log file
lib.truncate = function ( logId, callback){
  fs.truncate(lib.baseDir+logId+".log",0, function (err){
    if(!err){
      callback(false);
    }else{
      callback(err);
    }
  })
}
//export the module
module.exports = lib;