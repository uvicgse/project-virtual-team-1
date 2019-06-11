let images = {};
// let imageFiles = ["dog1.jpg", "dog2.jpg", "dog3.jpg", "dog4.jpg", "dog5.jpg"];
let imageFiles = ["jarjar.jpg", "yoda.png", "obiwan.jpg"];
let imageCount = 0;
let githubAvatarUrl = require('github-avatar-url');
let gh = require('octonode');

/**
 * Helper function for getting the letter icon for a given author.
 * 
 * @param name Name of the commit's contributor
 * @returns filepath for the given person's first initial
 */
function getLetterIcon(name: string) {
  let first = name.trim().charAt(0).toUpperCase();
  return "node_modules/material-letter-icons/dist/png/" + first + ".png";
}

function getName(author: string) {
  let name = author.split("<")[0];
  return name;
}

function img4User(name:string) {  
  return getLetterIcon(name);
}

// seems like this function was implemented as scaffolding for the profile pic feature.
function imageForUser(name: string, email: string, callback) {
  
  let pic;  
  
  if (email.includes('@users.noreply.github.com')) {
    
    // Extract GitHub username from noreply email (<number>+<username>@users.noreply.github.com)
    // This won't work for users that are NOT hiding their email in the GitHub settings.
    // See https://help.github.com/en/articles/about-commit-email-addresses for more info.
    let username = email.replace('@users.noreply.github.com','').replace(/^(\d){7}\+/,'');

    // github-avatar-url insists on having an API token, 
    // but since we're don't need it for public info, we'll instead use octonode to avoid having said token.
    let client = gh.client();
    client.get(`/users/${username}`, {}, function (err, status, body, headers) {
      if (!err)
        pic = body.avatar_url;
      else
        pic = getLetterIcon(name);
    });
  }
  // fallback to letter icons if the email isn't a GitHub noreply one
  else {
    pic = getLetterIcon(name);
  }  
  callback(pic);
}