/**
 * Storing and editing data
 */
var fs = require("fs");
var path = require("path");
const helpers = require("./helpers");

//Container module to be exported
var lib = {};
//Define the base directory
lib.baseDir = path.join(__dirname, "/.././.data/");
//Write data to file
lib.create = function(dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        var stringData = JSON.stringify(data);
        fs.writeFile(fileDescriptor, stringData, function (err){
            if(!err){
              fs.close(fileDescriptor, function(err){
                  if(!err){
                     callback(false);
                  }else{
                      callback("Error in closing")
                  }
              })
            }else{
                callback("Error in writing data");
            }
        })
      } else {
        callback("Could not create new file. it may already exist");
      }
    }
  );
};
//Read data from file 
lib.read = function (dir,file, callback){
  fs.readFile(lib.baseDir+dir+"/"+file+".json",'utf8', function (err,data){
    if(!err && data){

      var parsedData = helpers.parseJsonToObject(data);
      callback(false,parsedData)
    }else{
      callback(err,data);
    }
    
  });
}

//update the new file with data
lib.update =function(dir,file,data,callback){
  fs.open(lib.baseDir+dir+"/"+file+".json","r+",function (err,fileDescriptor){
          if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);
              fs.ftruncate(fileDescriptor,function(err){
                if(!err){
                  fs.writeFile(fileDescriptor, stringData, function(){
                    if(!err){
                            fs.close(fileDescriptor, function (err){
                              if(!err){
                                callback(false);
                              }else{
                               callback("Error in closing");
                              }
                            })
                    }else{
                      callback("Error is to writing existing file");
                    }
                  })
                }else{
                   callback("Error");
                }
              })
          }else{
            callback("Error");
          }
  })
}

//delete the file 
lib.delete = function (dir, file,callback){
  fs.unlink(lib.baseDir+dir+"/"+file+".json",function (err){
    if(!err){
      callback(false);
    }else{
      callback(500,{"Error":"Error in deleting file"});
    }
  });
}

//List all the items in the directory
lib.list = function (dir, callback){
  fs.readdir(lib.baseDir+dir+"/", function(err,data){
       if(!err &&data &&data.length>0){
            var trimmedFileNames =[];
            data.forEach(function(fileName){
             trimmedFileNames.push(fileName.replace(".json",""));
            });

            callback(false, trimmedFileNames);
       }else{
         callback(err,data);
       }
  })
}

//module to be export
module.exports = lib;
