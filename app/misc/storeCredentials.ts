var CryptoJS = require("crypto-js");
const os = require('os');
var jsonfile = require('jsonfile');
var encryptedToken;

function encryptAccessToken(accessToken) {
  encryptedToken = CryptoJS.AES.encrypt(accessToken, os.hostname());
  var file = 'data.json';
  var obj = {'accessToken': encryptedToken.toString()};

  jsonfile.writeFile(file, obj, function (err) {
    if (err) throw err;
    console.log('Access Token Saved to File System.');

  })
}

// Returns the un-encrypted access token that is stored in memory
function getAccessToken(){
  // If user is not logged in, return null
  if (!!!encryptedToken)
    return null
  // Decrypt the access token to
  var bytes = CryptoJS.AES.decrypt(encryptedToken.toString(), os.hostname());
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Takes in the un-encrypted access token, then encrypts it and stores it in memory
function encryptTemp(token) {
  encryptedToken = CryptoJS.AES.encrypt(token, os.hostname());
}
