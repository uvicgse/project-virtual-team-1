var CryptoJS = require("crypto-js");
const os = require('os');
var jsonfile = require('jsonfile');
var fs = require('fs');
var encryptedPassword;
var encryptedUsername;


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

function getAccesToken(){
  if (encryptAccessToken === undefined)
    return null;
  else {
    var decryptedAccessTokenBytes = CryptoJS.AES.decrypt(encryptedUsername.toString(), os.hostname());
    return decryptedAccessTokenBytes.toString(CryptoJS.enc.Utf8);
  }
}

function encryptTemp(username, password) {
  encryptedUsername = CryptoJS.AES.encrypt(username, os.hostname());
  encryptedPassword = CryptoJS.AES.encrypt(password, os.hostname());  
}

function getUsernameTemp() {
  if (encryptedUsername === undefined){ // the user has not logged in, return null
    return null;
  }else {
    var decryptedUsernameBytes = CryptoJS.AES.decrypt(encryptedUsername.toString(), os.hostname());
    return decryptedUsernameBytes.toString(CryptoJS.enc.Utf8);
  }
}

function getPasswordTemp() {
  if(encryptedPassword === undefined){ //the user did not login, return null
    return null;
  }else {
    var decryptedPasswordBytes = CryptoJS.AES.decrypt(encryptedPassword.toString(), os.hostname());
    return decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);
  }
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



