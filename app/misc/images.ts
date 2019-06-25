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
 * @param username GitHub username
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
      console.log(`[GitHub API] ${username} --> ERROR: ${err}`);
      console.log("ERROR: GitHub API request failed; using letter icons instead");

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
function imageForUser(name: string, email: string, upstreamUrl: string, commitHash: string, callback) {
  
  // try the cache first
  let pic = images[email];
  if (typeof(pic) !== 'undefined') {
    console.log(`[Cached] ${email}: ${pic}`)
    callback(pic);
  }
  // cache miss
  else if (upstreamUrl !== 'null' && commitHash !== 'null') {

    let pic;
    let client = gh.client();
    let repoPath = upstreamUrl.replace('https://github.com/','').replace('.git','');
    
    // GET https://api.github.com/repos/{repo_owner}/{repo_name}/commits/{commitHash}
    let ghCommit = `repos/${repoPath}/commits/${commitHash}`;
    
    let t = client.get(ghCommit, {}, function (err, status, body, headers) {
      if (!err) {          
        pic = body.author.avatar_url;
        console.log(`[GitHub API] ${email}: ${pic}`)
        images[email] = pic;   // add to cache
      }
      else {
        console.log(`[GitHub API] ${ghCommit} --> ERROR: ${err}`);
        console.log("ERROR: GitHub API request failed; using letter icons instead");
  
        pic = getLetterIcon(name);
      }
      callback(pic);
    });    

  }
  // upstreamUrl/commitHash not provided, so fallback to letter icons
  else {
    pic = getLetterIcon(name);
    callback(pic);
  }
}
