var CryptoJS = require("crypto-js");
const os = require('os');
var jsonfile = require('jsonfile');
var fs = require('fs');
var encryptedPassword;
var encryptedUsername;
var encryptedToken;


function encrypt(username, password) {

    //OS.hostname() is the key.
    //AES encryption
       
    encryptedUsername = CryptoJS.AES.encrypt(username, os.hostname());
    encryptedPassword = CryptoJS.AES.encrypt(password, os.hostname());


    writetoJSON(encryptedUsername, encryptedPassword);
    
}

function encryptAccessToken(accessToken) {
  encryptedAccessToken = CryptoJS.AES.encrypt(accessToken, os.hostname());
  var file = 'data.json';
  var obj = {'accessToken': encryptedAccessToken.toString()};

  jsonfile.writeFile(file, obj, function (err) {
    if (err) throw err;
    console.log('Access Token Saved to File System');

  })
}

function getAccessToken(){
  if (encryptAccessToken === undefined)
    return null;
  else {
    var decryptedAccessTokenBytes = CryptoJS.AES.decrypt(encryptedToken.toString(), os.hostname());
    return decryptedAccessTokenBytes.toString(CryptoJS.enc.Utf8);
  }
}

function encryptTemp(token) {
  encryptedToken = CryptoJS.AES.encrypt(token, os.hostname());
}

function getTokenTemp() {
  if (encryptedToken === undefined){ // the user has not logged in, return null
    return null;
  }else {
    var decryptedTokenBytes = CryptoJS.AES.decrypt(encryptedToken.toString(), os.hostname());
    return decryptedTokenBytes.toString(CryptoJS.enc.Utf8);
  }
}

function getPasswordTemp() {
  // When using GitHub OAuth, the password for Git operations is always the following string
  return "x-oauth-basic";  
}

function writetoJSON(encryptedUsername, encryptedPassword) {
      
   console.log("encrypted username is: " + encryptedUsername);
   var file = 'data.json';
   var obj = {'username': encryptedUsername.toString(), 'password': encryptedPassword.toString()};
    
   jsonfile.writeFile(file, obj, function (err) {
     if (err) throw err;
     console.log('username and password succesfullt saved');
     
   })

}



