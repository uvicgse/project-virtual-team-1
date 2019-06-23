let gh = require('octonode');
let githubUsername = require('github-username');

// local cache for profile picture URLs
let images = {};

/**
 * Helper function for getting the letter icon for a given author.
 * 
 * @param name Name of the commit's author
 * @returns filepath for the picture containing the author's first initial
 */
function getLetterIcon(name: string) {
  let first = name.trim().charAt(0).toUpperCase();
  return "node_modules/material-letter-icons/dist/png/" + first + ".png";
}

/**
 * Helper function for getting a GitHub user's avatar
 *
 * @param GitHub username
 * @param callback(string)  URL of GitHub avatar image.
 *                          If the GitHub API can't be reached (or throws an error),
 *                          a placeholder letter icon is provided instead.
 */
function getGithubAvatar(username: string, callback) {
  
  // The GitHub API has lower rate limits for non-authenticated requests.
  // To increase the limit, supply an access token below; i.e. gh.client('token').
  // Tokens can be generated at https://github.com/settings/tokens
  let client = gh.client();
  
  let pic;

  let t = client.get(`/users/${username}`, {}, function (err, status, body, headers) {
    if (!err) {          
      pic = body.avatar_url;
      images[username] = pic;   // add to cache
      console.log(`[GitHub API] ${username}: ${pic}`)
    }
    else {
      console.log(`[GitHub API] ${err}`);
      console.log("GitHub API request failed; using letter icons instead");

      pic = getLetterIcon(name);
    }
    callback(pic);
  });
}

function getName(author: string) {
  let name = author.split("<")[0];
  return name;
}

// No longer in use, but keeping it here in case of any potential 
// backward-compatibility issues on other VisualGit branches.
function img4User(name:string) {  
  return getLetterIcon(name);
}

/** Retreives the URL for the given author's GitHub profile picture.*/
function imageForUser(name: string, email: string, callback) {
  
  let pic;  
  
  if (email.includes('@users.noreply.github.com')) {
    
    // Extract GitHub username from noreply email (<number>+<username>@users.noreply.github.com)
    // This won't work for users that are NOT hiding their email in the GitHub settings.
    // See https://help.github.com/en/articles/about-commit-email-addresses for more info.
    let username = email.replace('@users.noreply.github.com','').replace(/^(\d){4,}\+/,'');
    
    // try the local cache first
    pic = images[username];
    if (typeof(pic) !== "undefined") {
      console.log(`[Cached] username: ${pic}`)
      callback(pic);
    }
    else {
      
      getGithubAvatar(username, function(pic) {
        callback(pic);
      });

      // /** TODO: refactor avatar URL retrieval into helper function **/  

      // // github-avatar-url insists on having an API token, 
      // // but since we're don't need it for public info, we'll instead use octonode to avoid having said token.
      // // That being said, if you've hit the rate limit, just supply the token below; i.e. gh.client('token')
      // let client = gh.client();
      
      // let t = client.get(`/users/${username}`, {}, function (err, status, body, headers) {
      //   if (!err) {          
      //     pic = body.avatar_url;
      //     images[username] = pic;   // add to cache
      //     console.log(`GitHub API: ${pic}`)
      //   }
      //   else {
      //     console.log(`GitHub API: ${err}`);
      //     console.log("GitHub API request failed; using letter icons instead");

      //     pic = getLetterIcon(name);
      //   }
      //   /** end refactor segment **/

      //   callback(pic);
      // });
    }
  }
  // Email not "@users.noreply.github.com", so try to get GitHub username from email
  else {
    
    // Get GitHub username from email
    let username;

    githubUsername(email).then(
      function(user) {	
        console.log(`[GitHub API] ${email} --> ${user}`);
        username = user;
      },
      function(err) {
        console.log(`[GitHub API] ERROR: ${err}`);
      }
    );
    
    // Now use the username to retrieve the profile picture URL
    if (typeof username !== 'undefined') {
      // TODO: GET /users/{username}
      getGithubAvatar(username, function(imageUrl) {
        pic = imageUrl;
      });
    }
    else {
      console.log(`ERROR: Couldn't get GitHub username for ${email}; using letter icons instead`);
      pic = getLetterIcon(name);    
    }
    callback(pic);
  }
}
