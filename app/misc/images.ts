let gh = require('octonode');

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
      console.log(`Cached image URL: ${pic}`)
      callback(pic);
    }
    else {
      // github-avatar-url insists on having an API token,
      // but since we're don't need it for public info, we'll instead use octonode to avoid having said token.
      // That being said, if you've hit the rate limit, just supply the token below; i.e. gh.client('token')
      let client = gh.client();

      let t = client.get(`/users/${username}`, {}, function (err, status, body, headers) {
        if (!err) {
          pic = body.avatar_url;
          images[username] = pic;   // add to cache
          console.log(`GitHub API: ${pic}`)
        }
        else {
          console.log(`ERROR: GitHub API: ${err}`);
          console.log("GitHub API request failed; using letter icons instead");

          pic = getLetterIcon(name);
        }
        callback(pic);
      });
    }
  }
  // fallback to letter icons if the email isn't a GitHub noreply one
  else {
    pic = getLetterIcon(name);
    console.log("No GitHub username detected; using letter icons instead");
    callback(pic);
  }
}
