var CryptoJS = require("crypto-js");
const os = require("os");
var jsonfile = require("jsonfile");
var fs = require("fs");
var file;

var encryptedToken;

function decrypt() {
  file = "data.json";

  var objRead = jsonfile.readFileSync(file); //JSON Object containing credentials

  encryptedToken = objRead.accessToken;
}

function getToken() {
  // If access token not present in data.json, return null
  if(!encryptedToken)
    return null;

  var decryptedTokenBytes = CryptoJS.AES.decrypt(
    encryptedToken.toString(),
    os.hostname()
  );
  return decryptedTokenBytes.toString(CryptoJS.enc.Utf8);
}