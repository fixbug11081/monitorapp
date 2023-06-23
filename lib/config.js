/*
*Create config and export
*/
var environment ={};
environment.staging ={
    'httpPort':3000,
    'httpsPort':3001,
    'envName':"staging",
    'hashingSecret':"thisIsASecret",
    'maxChecks':5,
    'twilio':{
        'accountSid':'AC4f243c4e84bf98d41d812b72c3992105',
        'authToken':'b2719eb8bc33e408f8098b9272047f29',
        'fromPhone':'+14067197930',
    }
};
environment.production={
    'httpPort':5000,
    'httpsPort':5001,
    'envName':"production",
    'hashingSecret':"thisIsAAlsoSecret",
    'maxChecks':5,
    'twilio':{
        'accountSid':'AC4f243c4e84bf98d41d812b72c3992105',
        'authToken':'b2719eb8bc33e408f8098b9272047f29',
        'fromPhone':'+14067197930',
    }
};

var currentEnivronment = typeof(process.env.NODE_ENV)==="string"?process.env.NODE_ENV.toLowerCase():"";
var environmentToExport = typeof(environment[currentEnivronment])=="object"?environment[currentEnivronment]:environment.staging;

module.exports = environmentToExport;
//openssl req -newkey RSA:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem