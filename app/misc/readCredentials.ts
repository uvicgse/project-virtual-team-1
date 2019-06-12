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

// Removes the data.json file from the filesystem
function deleteToken() {
  file = "data.json"
  try {
    // Remove file
    fs.unlinkSync(file);
    encryptedToken = null;
  } catch(err) {
    console.error(err)
  }
}

/**
 * Checks if a token exists in the data.json file.
 * getToken() returns an empty string if the token was saved during the same session,
 * so this function is a workaround for that.
 */
function tokenExists() {

  if(!encryptedToken)
    return false;

  if (encryptedToken == '')
    return false;
  else 
    return true;
}