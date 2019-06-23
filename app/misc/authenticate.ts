/// <reference path="git.ts" />

let $ = require("jquery");

//import * as nodegit from "git";
//import NodeGit, { Status } from "nodegit";

// Oauth Import
let electronOauth2 = require('electron-oauth2');
let { BrowserWindow } = require('electron').remote;

let Git = require("nodegit");
let github = require("octonode");
let repo;
let repoName;
let githubName;
let aid, atoken;
let client;
let avaterImg;
let repoList = {};
let url;
let account;
var repoNotFound = 0;
var signed = 0;
var changes = 0;
let signedAfter = false;
let loginScopes = "user repo";
let password = "x-oauth-basic";

// Configuration of Oauth Application Variables
const OauthConfig = {
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  useBasicAuthorizationHeader: false,
  redirectUri: 'http://localhost'
};
const windowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
  }
};

// Initialize an instance of electronOauth2
const githubOAuth = electronOauth2(OauthConfig, windowParams);

//Called then user pushes to sign out even if they have commited changes but not pushed; prompts a confirmation modal
function CommitNoPush() {
        if (CommitButNoPush == 1) {
                $("#modalW2").modal();
        }
}

function signInHead(callback) {
  encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
  continuedWithoutSignIn = false;
  signedAfter = true;
  if (signed == 1){
    if ((changes == 1) || (CommitButNoPush == 1)){
      $("#modalW2").modal();
    }
    else {
      getUserInfo(callback);
    }
  }
  else{
    getUserInfo(callback);
  }
}

function LogInAfterConfirm(callback) {
        encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
        getUserInfo(callback);
}

function ModalSignIn(callback) {
        encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
        getUserInfo(callback);
}

// provide a fresh cred object.
// previously we were trying to use same object again and again which was cauing issues
function getCredentials(){
  //Note: might need to update with Oauth
  return Git.Cred.userpassPlaintextNew(getAccessToken(), password);
}


function loginWithSaved(callback) {
  // Get the saved access token from the file system
  var accessToken = getToken();

  // Store the token in memory
  encryptTemp(accessToken);

  // Set the client for future use
  client = github.client(accessToken);

  // If the client fails to be initialized, a new access token is required...
  if (!client.token)
    return;

  // Set the account global to access the username later on
  client.get('/user', {}, function (err, status, body, headers) {
    // Set the global state of account
    account = body;

    // Trigger next step in login process
    getUserInfo(callback);
  });

}

function searchRepoName() {
  let ul = document.getElementById("repo-dropdown");

  ul.innerHTML = ''; // clears the dropdown menu which shows all the repos

  // Gets users name and password
  cred = getCredentials();

  var ghme = client.me();
  ghme.repos(function (err, data, head) {

    for (let i = 0; i < data.length; i++) {

      let rep = Object.values(data)[i];
      // console.log("url of repo: " + rep['html_url']);

      // Searches from the text input and adds to the list if repo name is found
      if (parseInt(rep['forks_count']) == 0) {
        if (rep['full_name'].search(document.getElementById("searchRep").value) != -1) {
          displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
          repoList[rep['full_name']] = rep['html_url'];
        } else {
          repoNotFound = 1;
        }
      }

    }
    if(repoNotFound == 1){
      ul.innerHTML = '';
      displayBranch(document.getElementById("searchRep").value + ":" + " Is NOT a valid repository.", "repo-dropdown", "");
      repoNotFound = 0;
    }
  });
}

function authenticateUser(callback) {
  // Opens Oauth Window and Retrieves Token
  githubOAuth.getAccessToken({scope: loginScopes})
    .then(token => {
      // Make sure token was received succesfully
      if(!token)
        return;

      // Save access token to filesystem
      encryptAccessToken(token['access_token']);

      // Initialize github client with token from Oauth
      client = github.client(token['access_token']);

      // If the client fails to be initialized, a new access token is required...
      if (!client.token)
        return;

      // Set the account global to access the username later on
      client.get('/user', {}, function (err, status, body, headers) {
        // Set the account variable
        account = body;

        // When user differs sign in, the sign in button must be hidden
        hideSignInButton();

        // Trigger next step in login process
        getUserInfo(callback);
      });

    }, err => {
      console.log('ERROR while getting token. ', err);
	}).catch( err => {
    console.log("Token error: " + err);
  });
}


function getUserInfo(callback) {

  cred = getCredentials();

  var ghme = client.me();

  ghme.info(function(err, data, head) {
    if (err) {
      if (err.toString().indexOf("OTP") !== -1) {
        github.auth.config({
          id: OauthConfig.clientId,
          secret: OauthConfig.clientSecret,
        }).login({"scopes": loginScopes,
          "note": Math.random().toString()
        }, function (err, id, token, headers) {
          document.getElementById("submitOtpButton")!.onclick = function() {
            submitOTP(callback);
          }
          $("#otpModal").modal('show');
        });
      }
      // HttpError has the error code in statusCode
      else if (401 == err.statusCode) {
        // 401 ==> Unauthorized (hence invalid username and password)
        displayModal("Authentication Error: Please check your username and password.")
      }
      else if (err.errno == "ENOTFOUND" || err.errno =="ENOENT") {
        displayModal("Authentication Error: Please check your internet connection");
      }
      else {
        displayModal(err);
        console.log("ERROR fetching user information: " + err);
      }
      document.getElementById('grey-out').style.display = 'none';
    }

    if (!err) {
      processLogin(ghme, callback);
    }

  });


}

function submitOTP(callback) {
  github.auth.config({
    id: OauthConfig.clientId,
    secret: OauthConfig.clientSecret,
    otp: document.getElementById("otp")!.value
  }).login({"scopes": loginScopes,
    "note": Math.random().toString()
  }, function (err, id, token, headers) {
    if (err) {
      displayModal(err);
      console.log("ERROR submitting OTP: " + err);
    }
    else {
      client = github.client(token);
      var ghme = client.me();
      processLogin(ghme, callback);
    }
  });
}


function processLogin(ghme, callback) {
  ghme.info(function(err, data, head) {
    if (err) {
      displayModal(err);
      console.log("ERROR processing login: " + err);
    } else {
      avaterImg = Object.values(data)[2]
      document.getElementById("githubname").innerHTML = data["login"]
      let doc = document.getElementById("avatar");
      signed = 1;
      callback();
    }
  });

  ghme.repos(function(err, data, head) {
    if (err) {
      return;
    } else {
       displayUsername();
      document.getElementById("avatar").innerHTML = "Sign out";
      console.log("Number of repos associated to logged in user: " + data.length + " To display urls of said repos, uncomment the log below this one in processLogin() in authenticate.ts.");
      for (let i = 0; i < data.length; i++) {
        let rep = Object.values(data)[i];
        // The following line lists the URL of all the repos associated with the logged in user.
        // It was clogging the debugging console with unneccessary information so it's been commented
        // out for the time being.
        // console.log("url of repo: " + rep['html_url']);

        if(rep['fork'] == false) {
          if(parseInt(rep['forks_count']) == 0) {
            displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
            repoList[rep['full_name']] = rep['html_url'];
          }
          else {
            //Create a collapseable list for the forked repo
            createDropDownFork(rep['full_name'],"repo-dropdown");
            repoList[rep['full_name']] = rep['html_url'];
            //Reiterate through and get all the forks of the repo and add to list
            for(let i = 0; i < data.length; i++) {
              let rep2 = Object.values(data)[i];
              if(rep2['name'] == rep['name']) {
                displayBranch("&nbsp; &nbsp;" +rep2['full_name'],rep['full_name'],"selectRepo(this)")
                repoList["&nbsp; &nbsp;"+rep2['full_name']] = rep2['html_url'];
              }
            }
          }
        }
      }
    }
  });
}

//Converts string to base 64 to be used for Basic Authorization in external API calls
function make_base_auth(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return 'Basic ' + hash;
}

function selectRepo(ele) {
  url = repoList[ele.innerHTML];
  let butt = document.getElementById("cloneButton");
  butt.innerHTML = 'Clone ' + ele.innerHTML;
  butt.setAttribute('class', 'btn btn-primary');
  if (butt.innerHTML != 'Clone'){
    butt.disabled = false;
  }
  console.log("Selected " + ele.innerHTML + " as repository");
}

function cloneRepo() {
  if (url === null) {
    updateModalText("Web URL for repo could not be found. Try cloning by providing the repo's web URL directly in the 'Add repository' window");
    return;
  }

  hidePRPanel();

  console.log("Cloning " + url);
  let splitUrl = url.split("/");
  let local;
  if (splitUrl.length >= 2) {
    local = splitUrl[splitUrl.length - 1];
  }
  console.log("Cloning " + local);

  if (local == null) {
    updateModalText("Error: could not define name of repo.");
    return;
  }

  downloadFunc(url, local);
  url = null;
  $('#repo-modal').modal('hide');

  switchToMainPanel();
}

function signOut() {
  // Initialize a window for the user to logout of github
  let window = new BrowserWindow(windowParams);
  window.loadURL('https://github.com/logout');
  window.show();

  // When the user closes the window...
  window.on('closed', () => {
    // Remove the data.json file
    deleteToken();
    // Redirect the user back to the login page
    redirectToHomePage();
  });

}

function redirectToHomePage() {
  window.onbeforeunload = Confirmed;
  window.location.href = "index.html";
  signed = 0;
  changes = 0;
  CommitButNoPush = 0;
  //LogInAfterConfirm();
}

function closeIssue() {

}

function addIssue(rep,id, onclick) {
  let ul = document.getElementById(id);
  let li = document.createElement("li");
  let issueTitle = document.createElement("p");
  let issueBody = document.createElement("p");
  let assignees = document.createElement("p");
  let closeIssue = document.createElement("button");
  closeIssue.innerHTML = "Comments"
  closeIssue.setAttribute("onclick",onclick)
  closeIssue.setAttribute("id",rep["number"]);
  closeIssue.setAttribute("class","btn btn-primary")
  assignees.innerHTML = "Assignees: "
  issueTitle.setAttribute("class", "issue-text");
  issueBody.setAttribute("class","issue-text");
  assignees.setAttribute("class","issue-text");
  li.setAttribute("role", "presentation")
  li.setAttribute("class","list-group-item")
  issueTitle.innerHTML = "Issue Name:" +rep["title"];
  issueBody.innerHTML = "Body:" + rep["body"];
  li.appendChild(issueTitle);
  li.appendChild(issueBody);
  if(rep["assignees"].length != 0 ) {
    for(let i = 0;i<rep["assignees"].length; i++) {
      assignees.innerHTML += rep["assignees"][i]["login"]
      if((i+1)>=rep["assignees"].length) {
        assignees.innerHTML += "."
      }
      else {
        assignees.innerHTML += ","
      }
    }
    li.appendChild(assignees);
  }
  if(rep["comments"].length != 0 ) {
  }
  li.appendChild(closeIssue);
  ul.appendChild(li);
}

function addComment(rep,id) {
  let ul = document.getElementById(id);
  let li = document.createElement("li");
  let button = document.createElement("button");
  let comment = document.createElement("p");
  li.setAttribute("role", "presentation")
  li.setAttribute("class","list-group-item")
  comment.innerHTML = rep["user"]["login"] +":" + rep["body"];
  comment.setAttribute("class","issue-text");
  li.appendChild(comment);
  ul.appendChild(li);

}

$('#commentModal').on('hidden.bs.modal', function () {
  var comment = document.getElementById("#comment-list");
  comment.innerHTML = "";
})


let issueId = 0;
function commentOnIssue(ele) {
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  $('#commentModal').modal('show');
  issueId = ele["id"];
  let ul = document.getElementById("comment-list");
  ul.innerHTML = ''; // clears the dropdown menu which shows all the issues
  var ghissue= client.issue(githubName + '/' + repoName,ele["id"]);
  ghissue.comments(function (err, data, head) {
    for (let i = 0; i < data.length; i++) {
      let rep = Object.values(data)[i];
        addComment(rep, "comment-list");
  }
  });
}


function createCommentForIssue() {
  var theArray = $('#newComment').serializeArray();
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  var ghissue= client.issue(githubName + '/' + repoName,issueId);
  ghissue.createComment({
    body: theArray[0]["value"]
  }, function (err, data, head) {
    let ele = {id:issueId};
    commentOnIssue(ele)
  });
}


function createIssue() {
  var theArray = $('#newIssue').serializeArray();
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  if (repoName != "repository" && theArray != null) {
      cred = getCredentials();
      client = github.client({
        id: OauthConfig.clientId,
        secret: OauthConfig.clientSecret,
      });
      var ghrepo = client.repo(githubName + '/' + repoName);
      ghrepo.issue({
        "title": theArray[0]["value"],
        "body": theArray[1]["value"],
        "assignee": theArray[2]["value"]
      }, function (err, data, head) {
        if(err != null) {
          document.getElementById("error-text-box").innerHTML = "Invalid Assignee: " + theArray[2]["value"];
          $('#errorModal').modal('show');
        }
        else {
          document.getElementById("issue-error-title").innerHTML = "Success";
          document.getElementById("error-text-box").innerHTML = "Successfuly added new Issue: " + theArray[0]["value"];
          $('#errorModal').modal('show');
        }
      }); //issue
      $('#issue-modal').modal('hide');
      displayIssues();
    }
}

function displayIssues() {
   repoName = document.getElementById("repo-name").innerHTML
   githubName = document.getElementById("githubname").innerHTML
      if (repoName != "repository") {

          let ul = document.getElementById("issue-dropdown");

          ul.innerHTML = ''; // clears the dropdown menu which shows all the issues

          // Create credentials off of Oauth token
          cred = getCredentials();

          client = github.client({
            id: OauthConfig.clientId,
            secret: OauthConfig.clientSecret,
          });

          var ghme = client.me();
          var ghrepo = client.repo(githubName + '/' + repoName);
          ghrepo.issues(function (err, data, head) {
              for (let i = 0; i < data.length; i++) {
                  let rep = Object.values(data)[i];
                  if(rep["state"] != "closed") {
                    addIssue(rep, "issue-dropdown", "commentOnIssue(this)");
                  }
              }
          });
      }
    }

function getUsername(){
  // Return null if the users account is not initialized
  if (!account)
    return null;

  // Return the users username
  return account.login;
}

// Get a git signature for the account that is logged in.
function getSignature(repository){
  // If the user has deffered loggin in, use the default signature
  if (!account)
    return repository.defaultSignature();
  // Set email to the email in account object
  var email = account.email;
  // If the email is null, change it to <uesrname>@users.noreply.github.com
  if (!email)
    email = account.login + '@users.noreply.github.com';
  // Return the signature
  return Git.Signature.now(account.login, email);
}
