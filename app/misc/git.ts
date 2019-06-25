import * as nodegit from "git";
import NodeGit, { Status } from "nodegit";
import * as simplegit from 'simple-git/promise';

let $ = require("jquery");
let Git = require("nodegit");
let sGit = require('simple-git/promise');
let fs = require("fs");
let async = require("async");
let readFile = require("fs-sync");
let green = "#84db00";
let repo, index, oid, remote, commitMessage;
let filesToAdd = [];
let theirCommit = null;
let modifiedFiles;
let prevStashList = []
let warnbool;
var CommitButNoPush = 0;
let stagedFiles: any;
let vis = require("vis");
let commitHistory = [];
let commitToRevert = 0;
let commitHead = 0;
let commitID = 0;
let lastCommitLength;
let refreshAllFlagCommit = false;




function passReferenceCommits(){
  Git.Repository.open(repoFullPath)
  .then(function(commits){
    sortedListOfCommits(commits);
  })
}

function sortedListOfCommits(commits){

    while (commits.length > 0) {
      let commit = commits.shift();
      let parents = commit.parents();
      if (parents === null || parents.length === 0) {
        commitHistory.push(commit);
      } else {
        let count = 0;
        for (let i = 0; i < parents.length; i++) {
          let psha = parents[i].toString();
          for (let j = 0; j < commitHistory.length; j++) {
            if (commitHistory[j].toString() === psha) {
              count++;
              break;
            }
          }
          if (count < i + 1) {
            break;
          }
        }
        if (count === parents.length) {
          commitHistory.push(commit);
        } else {
          commits.push(commit);
      }
    }
  }

}

function cloneFromRemote() {
  switchToClonePanel();
}

function refreshColor() {
  const userColorFilePath = ".settings/user_color.txt";

  // If user has previously saved a color, then set the app to that color
  if (fs.existsSync(userColorFilePath)) {
    fs.readFile(userColorFilePath, function (err, buffer) {
      let color = buffer.toString();
      changeColor(color);
    });
  }
}

function stage() {
  let repository;

  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      console.log("Found a repository.");
      return repository.refreshIndex();
    })

    .then(function (indexResult) {
      console.log("Found a file to stage.");
      index = indexResult;
      let filesToStage = [];
      filesToAdd = [];
      let fileElements = document.getElementsByClassName('file');
      for (let i = 0; i < fileElements.length; i++) {
        let fileElementChildren = fileElements[i].childNodes;
        if (fileElementChildren[1].checked === true) {
          filesToStage.push(fileElementChildren[0].innerHTML);
          filesToAdd.push(fileElementChildren[0].innerHTML);
        }
      }
      if (filesToStage.length > 0) {
        console.log("Staging files.");
        stagedFiles = index.addAll(filesToStage);
      } else {
        //If no files checked, then throw error to stop empty commits
        throw new Error("No files selected to commit.");
      }
    });

  if (stagedFiles == null || stagedFiles.length !== 0) {
    if (document.getElementById("staged-files-message") !== null) {
      enableCommit();
      let filePanelMessage = document.getElementById("staged-files-message");
      filePanelMessage.parentNode.removeChild(filePanelMessage);
    }
  }
}

function addAndCommit() {
  commitMessage = document.getElementById('commit-message-input').value; //Gets value from the commit message text area on main screen
  if (commitMessage == null || commitMessage == "") {
    commitMessage = document.getElementById('commit-message-input-navbar').value; //Gets value from the commit message text area in the navbar
  }
  if (commitMessage == null || commitMessage == "") {
    displayModal("Cannot commit without a commit message. Please add a commit message before committing"); //If both text areas are empty, then display this modal
    return;
  }
  let repository;

  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      console.log("Found a repository.");
      return repository.refreshIndex();
    })

    .then(function (indexResult) {
      console.log("Found a file to stage.");
      index = indexResult;
      let filesToStage = [];
      filesToAdd = [];
      let fileElements = document.getElementsByClassName('file');
      for (let i = 0; i < fileElements.length; i++) {
        let fileElementChildren = fileElements[i].childNodes;
        if (fileElementChildren[1].checked === true) {
          filesToStage.push(fileElementChildren[0].innerHTML);
          filesToAdd.push(fileElementChildren[0].innerHTML);
        }
      }
      if (filesToStage.length > 0) {
        console.log("Staging files.");
        return index.addAll(filesToStage);
      } else {
        //If no files checked, then throw error to stop empty commits
        throw new Error("No files selected to commit.");
      }
    })

    .then(function () {
      console.log("Found an index to write result to.");
      return index.write();
    })

    .then(function () {
      console.log("Creating a tree object using current index.");
      return index.writeTree();
    })

    .then(function (oidResult) {
      console.log("Changing " + oid + " to " + oidResult + ".");
      oid = oidResult;
      return Git.Reference.nameToId(repository, "HEAD");
    })

    .then(function (head) {
      console.log("Found the current commit.");
      return repository.getCommit(head);
    })

    .then(function (parent) {
      console.log("Verifying account.");
      let sign;

      sign = getSignature(repository);

      commitMessage = document.getElementById('commit-message-input').value;
      console.log("Signature to be put on commit: " + sign.toString());

      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("Head commit on remote: " + tid);
        console.log("Head commit on local repository: " + parent.id.toString());
        return repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent.id().toString(), tid.trim()]);
      } else {
        console.log('No other commits.');
        return repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent]);
      }
    })
    .then(function (oid) {
      theirCommit = null;
      console.log("Committing.");
      changes = 0;
      CommitButNoPush = 1;
      console.log("Commit successful: " + oid.tostrS());
      stagedFiles = null;
      hideDiffPanel();
      clearStagedFilesList();
      clearCommitMessage();
      displayModal("Commit successful");
      for (let i = 0; i < filesToAdd.length; i++) {
        addCommand("git add " + filesToAdd[i]);
      }
      addCommand('git commit -m "' + commitMessage + '"');

      refreshAll(repository);
    }, function (err) {
      console.log("ERROR: could not commit  " + err);
      updateModalText("Could not commit. " + err.message);
      // Added error thrown for if files not selected
      if (err.message == "No files selected to commit.") {
        displayModal(err.message);
        console.log("ERROR: " + err.message);
      }
    });
}

function clearStagedFilesList() {
  let filePanel = document.getElementById("files-staged");
  while (filePanel.firstChild) {
    filePanel.removeChild(filePanel.firstChild);
  }
  let filesChangedMessage = document.createElement("p");
  filesChangedMessage.className = "modified-files-message";
  filesChangedMessage.id = "staged-files-message";
  filesChangedMessage.innerHTML = "Your staged files will appear here";
  filePanel.appendChild(filesChangedMessage);

  disableCommit();
  changeColor();
}

// Clear all modified files from the left file panel
function clearModifiedFilesList() {
  let filePanel = document.getElementById("files-changed");
  while (filePanel.firstChild) {
    filePanel.removeChild(filePanel.firstChild);
  }
  let filesChangedMessage = document.createElement("p");
  filesChangedMessage.className = "modified-files-message";
  filesChangedMessage.id = "modified-files-message";
  filesChangedMessage.innerHTML = "Your modified files will appear here";
  filePanel.appendChild(filesChangedMessage);
  const userColorFilePath = ".settings/user_color.txt";

  refreshColor();
}

function clearCommitMessage() {
  document.getElementById('commit-message-input').value = "";
}

// checking if the length of commits is different
function checkCommitChange() {
  // get HEAD commit from current pointing branch
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repo.getHeadCommit().then(function(commit) {
        // get all commits under current pointing branch
        let history = commit.history();
        history.on("end", function (commits) {
          if (lastCommitLength !== commits.length) {
            console.log("Commit graph changes detected, refreshing graph.");
            // show refresh graph alert
            if (!refreshAllFlagCommit) {
              $("#refresh-graph-alert").show();
              $("#refresh-button").hide();
            } else {
              $("#refresh-graph-alert").hide();
              $("#refresh-button").show();
            }

            refreshAllFlagCommit = false;
          }

          lastCommitLength = commits.length;
        });
        history.start();
      });
    });
}

function getAllCommits(callback) {
  clearModifiedFilesList();
  let repos;
  let allCommits = [];
  let aclist = [];
  console.log("Finding all commits.");
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      console.log("Fetching all refs.");
      return repo.getReferences(Git.Reference.TYPE.LISTALL);
    })
    .then(function (refs) {
      let count = 0;
      console.log("Getting " + refs.length + " refs.");
      // while loop of asynchronous requests
      async.whilst(
        function test(cb) { cb(null, count < refs.length) },
        function (cb) {
          if (!refs[count].isRemote()) {
            console.log("Referenced branch exists on remote repository.");
            refs[count].peel(Git.Object.TYPE.COMMIT)
            .then(function(ref) {
              repos.getCommit(ref)
              .then(function (commit) {
                let history = commit.history(Git.Revwalk.SORT.Time);
                history.on("end", function (commits) {
                  for (let i = 0; i < commits.length; i++) {
                    if (aclist.indexOf(commits[i].toString()) < 0) {
                      allCommits.push(commits[i]);
                      aclist.push(commits[i].toString());
                    }
                  }
                  count++;
                  console.log(count + " out of " + allCommits.length + " commits.");
                  cb();
                });

                history.start();
              });
            })
          } else {
            console.log('Current branch does not exist on remote.');
            count++;
            cb();
          }
        },

        function (err) {
          console.log("ERROR: cannot load all commits: " + err + ".");
          callback(allCommits);
        });
    });
}

function PullBuffer() {
  if ((changes == 1) || (CommitButNoPush == 1)) {
    $("#modalW3").modal();
  }
  else {
    pullFromRemote();
  }
}

function pullFromRemote() {
  let repository;
  let branch = document.getElementById("name-selected").innerText;
  if (modifiedFiles.length > 0) {
    updateModalText("Please commit before pulling from remote!");
  }
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repository = repo;
      console.log("Pulling new changes from the remote repository.");
      addCommand("git pull");
      displayModal("Pulling new changes from the remote repository.");

      return repository.fetchAll({
        callbacks: {
          credentials: function () {
            return getCredentials();
          },
          certificateCheck: function () {
            return 1;
          }
        }
      });
    // Now that we're finished fetching, go ahead and merge our local branch
    // with the new one
    }).then(function () {
      return Git.Reference.nameToId(repository, "refs/remotes/origin/" + branch);
    }).then(function (oid) {
      console.log("Looking up commit with id " + oid + " in all repositories.");
      return Git.AnnotatedCommit.lookup(repository, oid);
    }).then(function (annotated) {
      console.log("Merging " + annotated + "with local forcefully.");
      Git.Merge.merge(repository, annotated, null, {
        checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      });
      theirCommit = annotated;
    }).then(function () {
      let conflicsExist = false;
      let tid = "";
      if (readFile.exists(repoFullPath + "/.git/MERGE_MSG")) {
        tid = readFile.read(repoFullPath + "/.git/MERGE_MSG", null);
        conflicsExist = tid.indexOf("Conflicts") !== -1;
      }

      if (conflicsExist) {
        let conflictedFiles = tid.split("Conflicts:")[1];
        refreshAll(repository);

        window.alert("Conflicts exists! Please check the following files:" + conflictedFiles +
         "\n Solve conflicts before you commit again!");
      } else {
        updateModalText("Successfully pulled from remote branch " + branch + ", and your repo is up to date now!");
        refreshAll(repository);
      }
      //anywhere during the above process if there is a error the following catch will catch and report it
      //and stop the process then and there.
    }).catch(function(err) {
      console.log("ERROR: Pull failed. Full error: " + err);
      updateModalText("Pull Failed : "+err.message);
    });

}

function pushToRemote() {
  let branch = document.getElementById("name-selected").innerText;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      console.log("Pushing changes to remote.")
      displayModal("Pushing changes to remote...");
      console.log("Branch name: " + branch);
      addCommand("git push -u origin " + branch);
      repo.getRemotes()
      .then(function (remotes) {
        repo.getRemote(remotes[0])
        .then(function (remote) {
          return remote.push(
                ["refs/heads/" + branch + ":refs/heads/" + branch],
                {
                  callbacks: {
                    credentials: function () {
                      return getCredentials();
                    }
                  }
                }
              );
        }).then(function() {
          CommitButNoPush = 0;
          window.onbeforeunload = Confirmed;
          console.log("Push successful.");
          updateModalText("Push successful");
          refreshAll(repo);
        }).catch(function(err) {
          console.log("ERROR: Push failed. Full error: " + err);
          updateModalText("Push Failed : "+err.message);
          });
        });
    });
}

function commitModal() {
  $('#set-commit-modal').modal('show');
  clearCommitModalText()
}

function openBranchModal() {
  $('#branch-modal').modal('show');

  // Shows current branch inside the branch mdoal
  let currentBranch = document.getElementById("name-selected").innerText;
  if (currentBranch === undefined || currentBranch == 'branch') {
    document.getElementById("currentBranchText").innerText = "Current Branch: ";
  } else {
    document.getElementById("currentBranchText").innerText = "Current Branch: " + currentBranch;
  }
}

function createBranch() {
  let branchName = document.getElementById("branch-name-input").value;

  // console.log(repo.getBranch(branchName), 'this');

  if (typeof repoFullPath === "undefined") {
    // repository not selected
    document.getElementById("branchErrorText").innerText = "Warning: You are not within a Git repository. " +
        "Open a repository to create a new branch. ";
  }



  // Check for empty branch name
  // @ts-ignore
  else if (branchName == '' || branchName == null) {
    // repository not selected
    document.getElementById("branchErrorText").innerText = "Warning: Please enter a branch name";
  }

  // Check for invalid branch name
  // @ts-ignore
  else if (isIllegalBranchName(branchName)) {
    // repository not selected
    // @ts-ignore
    document.getElementById("branchErrorText").innerText = "Warning: Illegal branch name. ";
  }

  // TODO: check for existing branch
  // Check for existing branch
  // else if ( <existing branch> ) {}

  else {
    let currentRepository;

    console.log("Branch " + branchName + " is being created.");
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        // Create a new branch on head
        currentRepository = repo;
        addCommand("git branch " + branchName);
        return repo.getHeadCommit()
          .then(function (commit) {
            return repo.createBranch(
              branchName,
              commit,
              0,
              getSignature(repo),
              "Created new-branch on HEAD");
          }, function (err) {
            console.log("ERROR occurred while trying to create a new branch " + err);
          });
      }).done(function () {
        $('#branch-modal').modal('hide');
        refreshAll(currentRepository);
          checkoutLocalBranch(branchName);
        });
    clearBranchErrorText();
  }
}

// search for tags
function searchTag() {
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repo.getCurrentBranch()
        .then(function () {
          // grab the list of references - these could be branches or tags
          return repo.getReferences(Git.Reference.TYPE.LISTALL);
        }).then(function (refList) {
          for (let i = 0; i < refList.length; i++) {

            // strip name for readability
            let refName = refList[i].name().split("/")[refList[i].name().split("/").length - 1];

            if (refList[i].isTag()){
              if (refName.indexOf( document.getElementById("tag-name").value ) > -1) {
                var attribute = "display:block";
              } else {
                var attribute = "display:none";
              }
              document.getElementById(refName).setAttribute("style", attribute);
            }
          }
        }
      )
    }
  );
}


function clearBranchErrorText() {
  // @ts-ignore
  document.getElementById("branchErrorText").innerText = "";
  // @ts-ignore
  document.getElementById("branch-name-input").value = "";
}

function isIllegalBranchName(branchName: string) : boolean {
  // Illegal pattern created by Tony Brix on StackOverflow
  // https://stackoverflow.com/questions/3651860/which-characters-are-illegal-within-a-branch-name
  let illegalPattern = new RegExp(/^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/);

  if (illegalPattern.exec(branchName)){
    return true;
  } else {
    return false;
  }
}

// Deletes a local branch
function deleteLocalBranch() {
  $('#delete-branch-modal').modal('toggle') // open warning modal
  let branchName = document.getElementById("branch-to-delete").value; // selected branch name
  console.log("Deleting branch: " + branchName)
  let repos;
  console.log(branchName + " is being deleted...")
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      addCommand("git branch --delete " + branchName);

      //check if the selected branch is a local branch
      repo.getBranch(branchName).then(function (reference) {
        Git.Branch.delete(reference) // delete local branch
      })
    }).then(function () {
      // refresh graph
      console.log("Deleted the local branch.")
      refreshAll(repos);
    })
}

// Deletes a remote branch
function deleteRemoteBranch() {
  $('#delete-branch-modal').modal('toggle') // open warning modal
  let branchName = document.getElementById("branch-to-delete").value; // selected branch name
  let repos;
  console.log(branchName + " is being deleted...");

  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      Git.Reference.list(repo).then(function (array) {
        if (array.includes("refs/remotes/origin/" + branchName)) {  // check if the branch is remote
          console.log("This is a remote branch.")

          // delete the remote branch
          repo.getRemote('origin').then(function (remote) {
            remote.push((':refs/heads/' + branchName),
              {
                callbacks: { // pass in user credentials as a parameter
                  credentials: function () {
                    return getCredentials();
                  }
                }
              }).then(function () {
                console.log("Deleted the remote branch.")
                updateModalText("The remote branch " + branchName + " has been deleted.")
              });
          })
        }
        else {
          console.log("This is a local branch.")
          updateModalText("A remote branch named " + branchName + " does not exist.")
          return;
        }
      })
    })
}

function mergeLocalBranches(element) {
  let bn = element.innerHTML;
  let fromBranch;
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
    })
    .then(function () {
      addCommand("git merge " + bn);
      return repos.getBranch("refs/heads/" + bn);
    })
    .then(function (branch) {
      console.log("Branch to merge from: " + branch.name());
      fromBranch = branch;
      return repos.getCurrentBranch();
    })
    .then(function (toBranch) {
      console.log("Branch to merge to: " + toBranch.name());
      return repos.mergeBranches(toBranch,
        fromBranch,
        getSignature(repos),
        Git.Merge.PREFERENCE.NONE,
        null);
    })
    .then(function (index) {
      let text;
      console.log("Checking for conflicts in merge at " + index);
      if (index instanceof Git.Index) {
        text = "Conflicts Exist";
      } else {
        text = "Merge Successfully";
      }
      console.log(text);
      updateModalText(text);
      refreshAll(repos);
    });
}

// Creates a tag in the current repository and updates the 'Create Tag' window and the network graph based on if it succeeds or fails.
// Creates a lightweight tag if no message is provided, otherwise creates an annotated tag.
function createTag(tagName: string, commitSha: string, pushTag: boolean, message?:string){
  let repo;
  Git.Repository.open(repoFullPath)
    .then(function(repoParam) {
      repo = repoParam;
    })
    .then(function() {
      return repo.getCommit(commitSha);
    })
    .then(function(commit){
      //The '0' parameter indicates that we are creating the tag without the '--force' option, so tags will not be overwritten
      if (message == undefined) {
        return Git.Tag.createLightweight(repo, tagName, commit, 0);
      } else {
        return Git.Tag.create(repo, tagName, commit, getSignature(repo), message, 0);
      }
    })
    .then(function(tagOid){
      // Push the tag if desired
      if (pushTag) {
        console.log("Pushing tag " + tagName);
        return repo.getRemotes()
          .then(function (remotes) {
            return repo.getRemote(remotes[0]);
          })
          .then(function(remote){
            return remote.push(
              ["refs/tags/" + tagName + ":refs/tags/" + tagName],
              {
                callbacks: {
                  credentials: function () {
                    return getCredentials();
                  }
                }
              }
            );
          }).then(function(){
            console.log("Successfully pushed tag " + tagName);
          });
      }
    })
    .then(function(){
      //Refresh the repository to display the new changes in the graph
      $("#createTagModal").modal('hide');
      updateModalText("Successfully created tag " + tagName + ".")
      refreshAll(repo)
    })
    .catch(function(msg){
      let errorMessage = msg.message;
      console.log("ERROR creating tag: " + errorMessage + ". Error thrown by createTag() in git.ts.");
      $("#createTagError")[0].innerHTML = errorMessage;

      // Re-enable the submit button
      $("#createTagModalCreateButton")[0].disabled = false;
    });
}

function mergeCommits(from) {
  let repos;
  let index;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      //return repos.getCommit(fromSha);
      addCommand("git merge " + from);
      return Git.Reference.nameToId(repos, 'refs/heads/' + from);
    })
    .then(function (oid) {
      console.log("Looking for commit with id " + oid + " in repositories.");
      return Git.AnnotatedCommit.lookup(repos, oid);
    })
    .then(function (annotated) {
      console.log("Force merge commit " + annotates + " into HEAD.");
      Git.Merge.merge(repos, annotated, null, {
        checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      });
      theirCommit = annotated;
    })
    .then(function () {
      if (fs.existsSync(repoFullPath + "/.git/MERGE_MSG")) {
        updateModalText("Conflicts exists! Please check files list on right side and solve conflicts before you commit again!");
        refreshAll(repos);
      } else {
        updateModalText("Successfully Merged!");
        refreshAll(repos);
      }
    });
}

// Rebase modal functionality starts here!
async function showRebaseModal() {
  $('#rebase-modal').modal('show');
  checkForOngoingRebase();
  getRebaseBranches();
}

// Check if there is already a rebase in progress, if so abort
function checkForOngoingRebase() {
    let sGitRepo = sGit(repoFullPath);
    if(fs.existsSync(repoFullPath + "/.git/rebase-apply")) {
        console.log('Aborting ongoing rebase');
        sGitRepo.silent(true).rebase(['--abort']);
    }
}

// A helper function that gets the strings selected for the rebase
function applyRebase() {
  // Get the branch selections
  let tempFromBranch = document.getElementById("fromBranches");
  let fromBranch = tempFromBranch.options[tempFromBranch.selectedIndex].value;
  let tempToBranch = document.getElementById("ontoBranches");
  let toBranch = tempToBranch.options[tempToBranch.selectedIndex].value;

  console.log('Branches to rebase from: ' + fromBranch + ', to: ' + toBranch);
  if ( document.getElementById("inlineCheckbox1").checked )
  {
    $('#exampleModal').modal('show');
  }
  // Calls the rebase function
  rebaseSimpleGit(fromBranch, toBranch);
}

// Populate dropdown menus with rebasable branches
async function getRebaseBranches(): void {
    let branches = await getEveryBranch();
    let rebaseOntoBranches = document.getElementById("ontoBranches");
    let rebaseFromBranches = document.getElementById("fromBranches");
    $( "#fromBranches" ).empty();
    $( "#ontoBranches" ).empty();
    for(let branch of branches){
        // onto options
        let ontoOption = document.createElement("option");
        ontoOption.value  = branch;
        ontoOption.innerText = branch;
        rebaseOntoBranches.appendChild(ontoOption);

        // from options
        let fromOption = document.createElement("option");
        fromOption.value  = branch;
        fromOption.innerText = branch;
        rebaseFromBranches.appendChild(fromOption);
    }
}

// Retrieves all possible branches for rebasing
async function getEveryBranch() {
  async function fetchBranches() {
    let repos;
    return Git.Repository.open(repoFullPath)
        .then(function (repo) {
          repos = repo;
          return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
        });
  }

  let branches = await fetchBranches();
  return branches;
}

// Actual Rebase implemented here with Simple-Git library.
function rebaseSimpleGit(from: string, to: string) {
  let sGitRepo = sGit(repoFullPath);
  sGitRepo.silent(true).rebase([to], (err, data) => {
    if (!err) {
        console.log('Remote url for repository at ' + __dirname + ':');
        console.log(data);
    }
  });
}

function mergeInMenu(from: string) {
  let p1 = document.getElementById("fromMerge");
  let p3 = document.getElementById("mergeModalBody");
  p1.innerHTML = from;
  p3.innerHTML = "Do you want to merge branch " + from + " to HEAD ?";
  $("#mergeModal").modal('show');
}

function resetCommit(name: string) {
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      addCommand("git reset --hard");
      return Git.Reference.nameToId(repo, name);
    })
    .then(function (id) {
      console.log("Looking for commit" + id);
      return Git.AnnotatedCommit.lookup(repos, id);
    })
    .then(function (commit) {
      let checkoutOptions = new Git.CheckoutOptions();
      return Git.Reset.fromAnnotated(repos, commit, Git.Reset.TYPE.HARD, checkoutOptions);
    })
    .then(function (number) {
      console.log("Resetting " + number);
      if (number !== 0) {
        updateModalText("Reset failed, please check if you have pushed the commit.");
      } else {
        updateModalText("Reset successfully.");
      }
      refreshAll(repos);
    }, function (err) {
      console.log("ERROR while resetting commit: " + err);
      updateModalText(err);
    });
}

/**
 * Clears the fields from the stash message modal.
 */
function clearStashMsgErrorText() {
  // @ts-ignore
  document.getElementById("stashMsgErrorText").innerText = "";
  // @ts-ignore
  document.getElementById("stash-msg-name-input").value = "";
  // @ts-ignore
  document.getElementById("untracked-files-checkbox").checked = false;
}

/**
 * show a dialog to get the stash message
 */
function showStashModal() {
  $('#stash-msg-modal').modal('show');
}

function handleStashError(err) {
  // handle any errors
  console.log("ERROR while stashing: " + err + ".");
  updateModalText("Stash error: " + err.message);
}

function doneStash() {
  // get rid of the modal
  $('#stash-msg-modal').modal('hide');
  // reset the modal's message
  clearStashMsgErrorText();
  // All the modified files have been stashed, so update the list of stage/unstaged files
  clearModifiedFilesList();
}

/**
 * Stashes all changes (note that only tracked files are stashed.)
 */
function stashChanges() {
  let stashMessage = document.getElementById("stash-msg-name-input").value

  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      // TODO: allow the user to select various options (include untracked, include ignored, etc.)

      // build the command string to show the user in the terminal
      let cmdStr = "git stash save";

      // stash flags -- set to default to start
      let flags = Git.Stash.FLAGS.DEFAULT;

      if (document.getElementById("untracked-files-checkbox").checked === true) {
        flags = flags | Git.Stash.FLAGS.INCLUDE_UNTRACKED;
        cmdStr = cmdStr + " --include-untracked"
      }

      // if there is a message add it to the command
      if (stashMessage.length > 0) {
        cmdStr = cmdStr + " \"" + stashMessage + "\""
      }

      // this line is to test error handling
      //throw new Error('test error');

      // show the command to the user
      addCommand(cmdStr);

      Git.Stash.save(repo, getSignature(repo), stashMessage, flags)
        .then(function(oid) {
          // error for testing purposes
          //throw new Error('test error2');
          console.log("Change stashed with oid " + oid + ".");
      }).catch(function(err) {
        handleStashError(err)
      }).done(function() {
        doneStash()
      });
    }).catch(function(err) {
      handleStashError(err)
    }).done(function() {
      doneStash()
    });
}

/**
 * Pop a single stashed state from the top of the stash list
 */
function popStash(index) {
  let sGitRepo = sGit(repoFullPath);
  sGitRepo.silent(true).stash(["pop",index]).then((result)=>{
    addCommand("git stash pop " + index)
  }).catch(function(err) {
    handleStashError(err);
  });
}

/**
 * Queries for stash list and displays it
 */
function displayStashes(){
  let sGitRepo = sGit(repoFullPath);

  sGitRepo.silent(true).stashList().then((list)=>{
    // check if the list changed
    if (isStashListTheSame(list) === false) {
      // clear the list
      let stashList = document.getElementById("stash-list")!;
      stashList.innerHTML = "";
      // update the list
      list.all.forEach((element,key) => {
        //generate list element
        let stashElement = document.createElement("li");
        stashElement.className = "list-group-item stash-list-item list-group-item-action";
        stashElement.innerHTML = element.message;
        //allow showing of stash info on click
        stashElement.onclick = function () {
          showStashInfo(key);
        }

        //generate apply button
        let applyButton = document.createElement("i");
        applyButton.className = "fa fa-arrow-circle-up fa-2x";
        applyButton.onclick = function (event){
          //stop propgation required to not activate on show
          event.stopPropagation();
          applyStash(key);
        };
        applyButton.title = "Apply Stash";

        //generate drop button
        let dropButton = document.createElement("i");
        dropButton.className = "fa fa-trash fa-2x";
        dropButton.onclick = function (event){
          //stop propgation required to not activate on show
          event.stopPropagation();
          dropStash(key);
        };
        dropButton.title = "Drop Stash";

        let buttons = document.createElement("div");
        buttons.className = "pull-right";
        buttons.style.display = "inline-block";

        //add buttons to list element
        buttons.appendChild(dropButton);
        buttons.appendChild(applyButton);
        stashElement.prepend(buttons);

        //allow drag and drop
        stashElement.draggable =true;

        stashElement.ondragstart = function (event){
          //visually show drop zone
          document.getElementById("graph-panel")!.classList.add("dropzone");
          event.dataTransfer!.effectAllowed = 'move';
          //generate data payload
          let payload = {
            operation: "stash",
            index: key
          };
          event.dataTransfer!.setData("text", JSON.stringify(payload));

          window.requestAnimationFrame(function(){
            document.getElementById("stash-panel-contents")!.hidden = true;
            document.getElementById("stash-drop-panel")!.hidden = false;
          });
        }

        stashElement.ondragend = function (event){
          //remove dropzone styling
          document.getElementById("graph-panel")!.classList.remove("dropzone");

          window.requestAnimationFrame(function(){
            document.getElementById("stash-panel-contents")!.hidden = false;
            document.getElementById("stash-drop-panel")!.hidden = true;
          });

          //required to prevent default drop handling
          event.preventDefault();
        };

        //add list element to list
        stashList.appendChild(stashElement);
      });
    }

    //hide stash list panel if there are no stashes to show
    if(list.all.length > 0){
      document.getElementById("stash-panel-wrapper")!.hidden =false;
    } else {
      document.getElementById("stash-panel-wrapper")!.hidden = true;
    }
  });
}

function showStashInfo(index) {
  let sGitRepo = sGit(repoFullPath);
  let stashIndex = ("stash@{" + index + "}");
  addCommand("git stash show " + stashIndex);
  sGitRepo.silent(true).stash(["show", stashIndex]).then((result)=> {
    updateModalText(result);
  }).catch(function(err) {
    handleStashError(err);
  });
}

function applyStash(index){
  let sGitRepo = sGit(repoFullPath);
  addCommand("git stash apply " + index)
  sGitRepo.silent(true).stash(["apply",index]).then((result)=>{
    // no op
  }).catch(function(err) {
    handleStashError(err);
  });
}

function dropStash(index){
  let sGitRepo = sGit(repoFullPath);
  addCommand("git stash drop " + index)
  sGitRepo.silent(true).stash(["drop",index]).then((result)=>{
    // no op
  }).catch(function(err) {
    handleStashError(err);
  });
}
function isStashListTheSame(list) {
  // get the list of hashes
  let currStashHashList = []
  list.all.forEach(element => {
    currStashHashList.push(element.hash);
  });

  currStashHashList.sort();

  let same = (currStashHashList.length === prevStashList.length)

  if (same) {
    // they are the same length, check each element now
    for (var i = currStashHashList.length - 1; i >= 0; --i) {
      if (currStashHashList[i] !== prevStashList[i]) {
        // found an element that is not the same.
        // update the cached version
        prevStashList = currStashHashList.slice();
        same = false;
      }
    }
  } else {
    // not the same length, so they are not the same
    prevStashList = currStashHashList.slice();
  }

  return same;
}

function revertCommit() {

  let repos;
  Git.Repository.open(repoFullPath)
  .then(function(Commits){
    sortedListOfCommits(Commits);
     console.log("Commits: "+ commitHistory[0]);
    })

    Git.Repository.open(repoFullPath)
    .then(function(repo){
      repos = repo;
      return repos;
      console.log("This is repos: "+ repos);
    })
    .then(function(Commits){
      let index = returnSelectedNodeValue()-1;
      let commitToRevert = commitHistory[index].sha().substr(0,7);
      addCommand("git revert "+ commitToRevert);

    let revertOptions = new Git.RevertOptions();
    revertOptions.mainline = 0;
    if(commitHistory[index].parents().length > 1) {
      revertOptions.mainline = 1;
    }

    revertOptions.mergeInMenu = 1;
    return Git.Revert.revert(repos, commitHistory[index],revertOptions)
    .then(function(number) {
      console.log("Reverting to " + number);
      if (number === -1) {
        updateModalText("Revert failed, please check if you have pushed the commit.");
      } else {
        updateModalText("Revert successfully.");
      }
      refreshAll(repos);
    })
    .catch(function (err) {
      console.log("ERROR reverting commit: " + err);
      updateModalText("Error reverting commit, please commit changes as they will be overwritten, then try again");
    })
  })
}

// Makes a modal for confirmation pop up instead of actually exiting application for confirmation.
function ExitBeforePush() {
  $("#modalW").modal();
}

function Confirmed() {

}

// makes the onbeforeunload function nothing so the window actually closes; then closes it.
function Close() {
  window.onbeforeunload = Confirmed;
  window.close();

}



function Reload() {
  window.onbeforeunload = Confirmed;
  location.reload();
}

function displayModifiedFiles() {
  modifiedFiles = [];

  let selectedFile = "";

  Git.Repository.open(repoFullPath)
    .then(function (repo) {

      repo.getStatus().then(function (statuses) {

        statuses.forEach(addModifiedFile);
        if (modifiedFiles.length !== 0) {
          if (document.getElementById("modified-files-message") !== null) {
            let filePanelMessage = document.getElementById("modified-files-message");
            filePanelMessage.parentNode.removeChild(filePanelMessage);
          }
        }

        modifiedFiles.forEach(displayModifiedFile);

        removeNonExistingFiles();
        refreshColor();

        function removeNonExistingFiles() {
          // If files displayed does not exist, remove them
          let filePaths = document.getElementsByClassName('file-path');
          for (let i = 0; i < filePaths.length; i++) {
            if (filePaths[i].parentElement.className !== "file file-deleted") {
              let filePath = path.join(repoFullPath, filePaths[i].innerHTML);
              if (!fs.existsSync(filePath)) {
                filePaths[i].parentElement.remove();
              }
            }
          }
        }

        // Add modified file to array of modified files 'modifiedFiles'
        function addModifiedFile(file) {

          // Check if modified file  is already being displayed
          let filePaths = document.getElementsByClassName('file-path');
          for (let i = 0; i < filePaths.length; i++) {
            if (filePaths[i].innerHTML === file.path()) {
              return;
            }
          }
          let path = file.path();
          let modification = calculateModification(file);
          modifiedFiles.push({
            filePath: path,
            fileModification: modification
          })
        }


        // Find HOW the file has been modified
        function calculateModification(status) {
          if (status.isNew()) {
            return "NEW";
          } else if (status.isModified()) {
            return "MODIFIED";
          } else if (status.isDeleted()) {
            return "DELETED";
          } else if (status.isTypechange()) {
            return "TYPECHANGE";
          } else if (status.isRenamed()) {
            return "RENAMED";
          } else if (status.isIgnored()) {
            return "IGNORED";
          }
        }

        function Confirmation() {
          $("#modalW").modal();
          return 'Hi';
        }

        function unstage(file, fileId) {
          // Get the fileId element and remove it
          document.getElementById(fileId).remove();
          let modFilesMessage = document.getElementById("modified-files-message");
          if (modFilesMessage != null) {
            modFilesMessage.remove();
          }
          // Check if there's no staged files, in case we need to print the "Your staged..."
          stagedFiles = index.remove(file);
          if (document.getElementById("files-staged").children.length == 0) {
            clearStagedFilesList();
            stagedFiles = null;
          }

          displayModifiedFile(file);
          refreshColor();
        }

        document.getElementById("stage-all").onclick = function () {
          let unstagedFileElements = document.getElementById('files-changed').children;
          while (unstagedFileElements.length > 0) {
            let checkbox = unstagedFileElements[0].getElementsByTagName("input")[0];
            try {
              checkbox.click();
            } catch (err) {
              break;
            }
          }
        };

        document.getElementById("unstage-all").onclick = function () {
          let stagedFileElements = document.getElementById('files-staged').children;
          while (stagedFileElements.length > 0) {
            let checkbox = stagedFileElements[0].getElementsByTagName("input")[0];
            try {
              checkbox.click()
            } catch (err) {
              break;
            }
          }
        };

        function displayModifiedFile(file) {
          let filePath = document.createElement("p");
          filePath.className = "file-path";
          filePath.innerHTML = file.filePath;
          let fileElement = document.createElement("div");
          window.onbeforeunload = Confirmation;
          changes = 1;
          // Set how the file has been modified
          if (file.fileModification === "NEW") {
            fileElement.className = "file file-created";
          } else if (file.fileModification === "MODIFIED") {
            fileElement.className = "file file-modified";
          } else if (file.fileModification === "DELETED") {
            fileElement.className = "file file-deleted";
          } else {
            fileElement.className = "file";
          }

          fileElement.draggable=true;
          fileElement.appendChild(filePath);
          fileElement.id = file.filePath;

          let checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox";
          checkbox.onclick = function (event) {
            if (checkbox.checked) {
              stage();
              displayStagedFile(file, fileElement.id);
              refreshColor();
            }
            // Stops a click from propagating to the other layers
            event.stopPropagation();
          }
          fileElement.appendChild(checkbox);

          document.getElementById("files-changed")!.appendChild(fileElement);

          // On drag action, the file element is shown to the user
          fileElement.addEventListener('dragstart', function handleDragStart(e) {
            var source=e.target;
            this.style.opacity = '0.4';  // this / e.target is the source node.
            //set both file element and file panel highlight colours
            e.target.style.border = '4px solid #39C0B9';
            document.getElementById("files-staged").classList.add("dropzone");
           }, false);

          //On drop action, the file changes state to staged, checkbox is clicked
          fileElement.addEventListener('dragend', function handleDragStart(e) {
          var divRect = document.getElementById('files-staged').getBoundingClientRect();
            //reset both file element and file panel highlight colours
          e.target.style.border = '1px solid white';
          document.getElementById("files-staged").classList.remove("dropzone");
          if (e.clientX >= divRect.left && e.clientX <= divRect.right &&
            e.clientY >= divRect.top && e.clientY <= divRect.bottom) {
              checkbox.click();
          }

          var source=e.target;
          this.style.opacity = '1.0';  // resets the view changes of dragstart
          }, false);

          fileElement.onclick = function () {
            let doc = document.getElementById("diff-panel")!;
            console.log("Width of document: " + doc.style.width);
            let fileName = document.createElement("p");
            fileName.innerHTML = file.filePath;
            // Get the filename being edited and displays on top of the window
            if (doc.style.width === '0px' || doc.style.width === '') {
              displayDiffPanel();
              // Insert elements that store filename and file path for file rename and move functionality
              document.getElementById("currentFilename")!.innerHTML = file.filePath;
              (<HTMLInputElement>document.getElementById("renameFilename")!).value = file.filePath;
              document.getElementById("currentFolderPath")!.innerHTML = repoFullPath;
              (<HTMLInputElement>document.getElementById("moveFileToFolder")!).value =repoFullPath;
              document.getElementById("diff-panel-body")!.appendChild(fileName);

              if (fileElement.className === "file file-created") {
                // set the selected file
                selectedFile = file.filePath;
                printNewFile(file.filePath);
              } else {
                //disable editing if deletion
                if(fileElement.className === "file file-deleted"){
                  hideDiffPanelButtons();
                }
                let diffCols = document.createElement("div");
                diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                document.getElementById("diff-panel-body")!.appendChild(diffCols);
                selectedFile = file.filePath;
                printFileDiff(file.filePath);
              }
            }
            else if (doc.style.width === '40%') {
              //populate modals
              document.getElementById("diff-panel-body")!.innerHTML = "";
              document.getElementById("currentFilename")!.innerHTML = file.filePath;
              (<HTMLInputElement>document.getElementById("renameFilename")!).value = file.filePath;
              document.getElementById("currentFolderPath")!.innerHTML = repoFullPath;
              (<HTMLInputElement>document.getElementById("moveFileToFolder")!).value =repoFullPath;
              document.getElementById("diff-panel-body")!.appendChild(fileName);

              if (selectedFile === file.filePath) {
                // clear the selected file when diff panel is hidden
                selectedFile = "";
                hideDiffPanel()
              } else {
                if (fileElement.className === "file file-created") {
                  selectedFile = file.filePath;
                  printNewFile(file.filePath);
                } else {
                  selectedFile = file.filePath;
                  printFileDiff(file.filePath);
                }

                //disable editing if entry is a deletion
                if(fileElement.className === "file file-deleted"){
                  hideDiffPanelButtons();
                } else {
                  displayDiffPanelButtons();
                }
              }
            }
            else {
              // clear the selected file when diff panel is hidden
              selectedFile = "";
              hideDiffPanel();
            }
          };
        }

        function displayStagedFile(file, fileId) {
          let filePath = document.createElement("p");
          filePath.className = "file-path";
          filePath.innerHTML = file.filePath;
          let fileElement = document.createElement("div");
          window.onbeforeunload = Confirmation;
          changes = 1;
          // Set how the file has been modified
          if (file.fileModification === "NEW") {
            fileElement.className = "file file-created";
          } else if (file.fileModification === "MODIFIED") {
            fileElement.className = "file file-modified";
          } else if (file.fileModification === "DELETED") {
            fileElement.className = "file file-deleted";
          } else if (file.fileModification === "RENAMED") {
            fileElement.className = "file file-renamed";
          } else {
            fileElement.className = "file";
          }

          //Allow the individual file elements to be draggable
          fileElement.draggable=true;
          fileElement.id = fileId;
          fileElement.appendChild(filePath);

          let checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox";
          checkbox.checked = true;
          checkbox.onclick = function (event) {
            unstage(file, fileId);
            // Stops a click from propagating to the other layers
            event.stopPropagation();
          }
          fileElement.appendChild(checkbox);

          document.getElementById("files-staged").appendChild(fileElement);
          document.getElementById(fileId).remove();

          if (document.getElementById("files-changed").children.length == 0) {
            clearModifiedFilesList();
          }

          //On drag action, the file element is shows to user
          fileElement.addEventListener('dragstart', function handleDragStart(e) {
              var source=e.target;
              this.style.opacity = '0.4';  // this / e.target is the source node.
              //set both file element and file panel highlight colours
              e.target.style.border = '4px solid #39C0B9';
              document.getElementById("files-changed").classList.add("dropzone");
          }, false);

          //On drop action, the file changes state to un-staged, checkbox is clicked
          fileElement.addEventListener('dragend', function handleDragStart(e) {
            var divRect = document.getElementById('files-changed').getBoundingClientRect();
            //reset both file element and file panel highlight colours
            e.target.style.border = '1px solid white';
            document.getElementById("files-changed").classList.remove("dropzone");
            if (e.clientX >= divRect.left && e.clientX <= divRect.right &&
              e.clientY >= divRect.top && e.clientY <= divRect.bottom) {
                checkbox.click();
            }
            var source=e.target;
            this.style.opacity = '1.0';  // this / e.target is the source node.
          }, false);

          fileElement.onclick = function () {
            let doc = document.getElementById("diff-panel");
            console.log("Width of document: " + doc.style.width);
            let fileName = document.createElement("p");
            fileName.innerHTML = file.filePath
            // Get the filename being edited and displays on top of the window
            if (doc.style.width === '0px' || doc.style.width === '') {
              displayDiffPanel();

              document.getElementById("diff-panel-body")!.innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (fileElement.className === "file file-created") {
                // set the selected file
                selectedFile = file.filePath;
                printNewFile(file.filePath);
              } else {

                let diffCols = document.createElement("div");
                diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                document.getElementById("diff-panel-body")!.appendChild(diffCols);
                selectedFile = file.filePath;
                printFileDiff(file.filePath);
              }
            }
            else if (doc.style.width === '40%') {
              document.getElementById("diff-panel-body").innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (selectedFile === file.filePath) {
                // clear the selected file when diff panel is hidden
                selectedFile = "";
                hideDiffPanel()
              } else {
                if (fileElement.className === "file file-created") {
                  selectedFile = file.filePath;
                  printNewFile(file.filePath);
                } else {
                  selectedFile = file.filePath;
                  printFileDiff(file.filePath);
                }
              }
            }
            else {
              // clear the selected file when diff panel is hidden
              selectedFile = "";
              hideDiffPanel();
            }
          };
        }

        function printNewFile(filePath) {
          let fileLocation = require("path").join(repoFullPath, filePath);
          let lineReader = require("readline").createInterface({
            input: fs.createReadStream(fileLocation)
          });

        let lineNumber = 0;
        lineReader.on("line", function (line) {
          lineNumber++;
          formatNewFileLine(lineNumber + "\t" + "+" + "\t" + line);
        });
      }

        function printFileDiff(filePath) {
          repo.getHeadCommit().then(function (commit) {
            getCurrentDiff(commit, filePath, function (line) {
              formatLine(line);
            });
          });
        }

        function getCurrentDiff(commit, filePath, callback) {
          commit.getTree().then(function (tree) {
            Git.Diff.treeToWorkdir(repo, tree, null).then(function (diff) {
              diff.patches().then(function (patches) {
                patches.forEach(function (patch) {
                  patch.hunks().then(function (hunks) {
                    hunks.forEach(function (hunk) {
                      hunk.lines().then(function (lines) {
                        let oldFilePath = patch.oldFile().path();
                        let newFilePath = patch.newFile().path();
                        if (newFilePath === filePath) {
                          lines.forEach(function (line) {

                            // Catch the "no newline at end of file" lines created by git
                            if (line.origin() != 62) {

                              // include linenumbers and change type
                              callback(String.fromCharCode(line.origin())
                                + (line.oldLineno() != -1 ? line.oldLineno() : "")
                                + "\t" + (line.newLineno() != -1 ? line.newLineno() : "")
                                + "\t" + String.fromCharCode(line.origin())
                                + "\t" + line.content());
                            }
                          });
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        }

        function formatLine(line) {
          let element = document.createElement("div");

          if (line.charAt(0) === "+") {
            element.style.backgroundColor = "#84db00";
          } else if (line.charAt(0) === "-") {
            element.style.backgroundColor = "#ff2448";
          } else if (line.includes("No newline at end of file")) {
            // mimic the git diff command line tool and show this line anyway
            // the line shows "<	12	<	\n\ No newline at end of file\n"
            // so just show "\ No newline at end of file" as per git
            line = "\ No newline at end of file"
          }

          // If not a changed line, origin will be a space character, so still need to slice
          line = line.slice(1, line.length);
          element.innerText = line;

          // The spacer is needed to pad out the line to highlight the whole row
          let spacer = document.createElement("spacer");
          spacer.style.width = document.getElementById("diff-panel-body")!.scrollWidth + "px";
          element.appendChild(spacer);

          document.getElementById("diff-panel-body")!.appendChild(element);
        }

        function formatNewFileLine(text) {
          let element = document.createElement("div");
          element.style.backgroundColor = green;
          element.innerHTML = text;

          // The spacer is needed to pad out the line to highlight the whole row
          let spacer = document.createElement("spacer");
          spacer.style.width = document.getElementById("diff-panel-body")!.scrollWidth + "px";
          element.appendChild(spacer);

          document.getElementById("diff-panel-body")!.appendChild(element);
        }
      });
    },
      function (err) {
        // this log line occurs far too frequently
        //console.log("waiting for repo to be initialised");
      });
}

// Find HOW the file has been modified
function calculateModification(status) {
  if (status.isNew()) {
    return "NEW";
  } else if (status.isModified()) {
    return "MODIFIED";
  } else if (status.isDeleted()) {
    return "DELETED";
  } else if (status.isTypechange()) {
    return "TYPECHANGE";
  } else if (status.isRenamed()) {
    return "RENAMED";
  } else if (status.isIgnored()) {
    return "IGNORED";
  }
}

function deleteFile(filePath: string) {
  let newFilePath = filePath.replace(/\\/gi, "/");
  if (fs.existsSync(newFilePath)) {
    fs.unlink(newFilePath, (err) => {
      if (err) {
        alert("An error occurred updating the file" + err.message);
        console.log("ERROR occurred updating the file " + err);
        return;
      }
      console.log("File successfully deleted.");
    });
  } else {
    alert("This file doesn't exist, cannot delete.");
  }
}

function cleanRepo() {
  let fileCount = 0;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      console.log("Removing untracked files.")
      displayModal("Removing untracked files...");
      addCommand("git clean -f");
      repo.getStatus().then(function (arrayStatusFiles) {
        arrayStatusFiles.forEach(deleteUntrackedFiles);

        //Gets NEW/untracked files and deletes them
        function deleteUntrackedFiles(file) {
          let filePath = path.join(repoFullPath, file.path());
          let modification = calculateModification(file);
          if (modification === "NEW") {
            console.log("Deleting file: " + filePath);
            deleteFile(filePath);
            console.log("File deletion successful.");
            fileCount++;
          }
        }

      })
        .then(function () {
          console.log("Cleanup successful.");
          if (fileCount !== 0) {
            updateModalText("Cleanup successful. Removed " + fileCount + " files.");
          } else {
            updateModalText("Nothing to remove.")
          }
          refreshAll(repo);
        });
    },
      function (err) {
        console.log("Waiting for repo to be initialised.");
        displayModal("Please select a valid repository");
      });
}

/**
 * This method is called when the user clicks the "Remote" button on the navbar.
 */
function setUpstreamModal() {
  $('#set-upstream-modal').modal('show');
  let repository;
  Git.Repository.open(repoFullPath)
      .then(function (repo) {
        repository = repo;
        Git.Remote.lookup(repository, 'upstream').then(function(remote) {
          document.getElementById("display-upstream").innerText = remote.url();
          document.getElementById("deleteUpstreamBtn").style.display = "block";
        }, function(err) {
          document.getElementById("display-upstream").innerText = 'No upstream repository currently configured.';
          document.getElementById("deleteUpstreamBtn").style.display = "none";
        });
    });
}

/**
 * Modal for editing the current upstream repo.
 */
function showEditUpstream() {
  $('#edit-upstream-modal').modal('show');
}

/**
 * Edit the current upstream repo.
 */
function editUpstream() {
  let repository;
  let upstreamRepoPath = document.getElementById("upstream-path").value;
  if(upstreamRepoPath != null) {
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
      repository = repo;
      addCommand("git remote rm upstream");
      Git.Remote.delete(repository, 'upstream').then(function(result) {
        addCommand("git remote add upstream " + upstreamRepoPath);
        Git.Remote.createWithFetchspec(repository, 'upstream', upstreamRepoPath, '+refs/heads/*:refs/remotes/upstream/*').then(function(remote) {
          displayModal("Upstream repository successfully configured.");
        }, function(err){
          displayModal(err);
        });
      });
    })
  }
  clearUpstreamModalText();
}

/**
 * Clears the fields from the upstream repo modal.
 */
function clearUpstreamModalText() {
  document.getElementById("upstream-path").value = "";
}

/**
 * Clears the fields from the commit modal.
 */
function clearCommitModalText() {
  document.getElementById("commit-message-input-navbar").value = "";
}

/**
 * Delete the current upstream repo.
 */
function showUpstreamDelete() {
  $('#delete-upstream-modal').modal('show');
  clearUpstreamModalText();
}

/**
 * Delete the current upstream repo.
 */
function deleteUpstream() {
  let repository;
  Git.Repository.open(repoFullPath)
      .then(function (repo) {
    addCommand("git remote rm upstream");
    Git.Remote.delete(repo, 'upstream').then(function(result) {
      displayModal('Upstream repository successfully deleted.')
    }, function(err) {
      displayModal(err);
    });
  });
}

/**
 This function is called after the user enters the address of the upstream repo to sync from. It sets the
 entered address as the upstream repo of the forked repository.
 */
function setUpstreamRepo() {
  let repository;
  let upstreamRepoPath = document.getElementById("upstream-path").value;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
    repository = repo;
    Git.Remote.lookup(repository, 'upstream').then(function(remote) {
      showEditUpstream();
      return;
    }, function(err) {
      var result = Git.Remote.createWithFetchspec(repository, 'upstream', upstreamRepoPath, '+refs/heads/*:refs/remotes/upstream/*');
      addCommand("git remote add upstream " + upstreamRepoPath);
      result.catch(function(error) {
      if (error.message == "cannot set empty URL"){ //Checking for empty URL in the upstream modal
        displayModal("Please enter a valid path to the original branch");
      }
      else if (error.message == "remote 'upstream' already exists"){ //Checking for existing upstream branch
        displayModal("Upstream branch already exists");
      }
      }), displayModal("Upstream repository successfully configured.");
    }, function(err) {
      console.log("ERROR adding remote upstream repository:" + err) //Checking if a repo is opened before setting an upstream
      displayModal("Please open a valid repository first.");
    });
  }
  clearUpstreamModalText();
}

/**
* This function is called when the user clicks the "Sync" button on the navbar. It syncs from the upstream repository
* configured in addRemoteRepo()
*/
function syncFromFork() {
  let repository;
  let commitRef;
  var fetchOptions = {
    callbacks: {
      credentials: function () { return getCredentials(); },
      certificateCheck: function () { return 1; }
    }
  }
  Git.Repository.open(repoFullPath)
  .then(function (repo) {
    repository = repo;
    var result = Git.Remote.addFetch(repository, 'upstream', 'remotes/upstream/master');
    return repository.fetch('upstream',fetchOptions) //fetch from upstream
  }, function (err) {
    console.log("ERROR fetching: " + err);
    displayModal("Error fetching:"+ err)
  })
  .then(function() {
    return repository.checkoutBranch("master") //checkout master
  }, function (err) {
    console.log("ERROR checking out branch: " + err);
    displayModal("Error checking out branch:"+ err)
  })
  .then(function() {
    return repository.mergeBranches("master", "upstream/master"); //merge upstream/master into master
  }, function (err) {
    console.log("ERROR merging: " + err);
    displayModal("Error merging:"+ err)
  })
  .then(function(oid){
    displayModal("Sync complete!")
  });
}

/**
 * This method implements Git Move to rename or move a given file within a repository using the simple-git library
 */

function moveFile(filesource:string, filedestination:string, skipFileExistTest:boolean = false) {
  console.log("Moving " + filesource + " in (" + repoFullPath + ") to " + filedestination);
  addCommand("git mv " + filesource + " " + filedestination);

  // test if file destination already exists or if test is to be skipped
  if(fs.existsSync(filedestination) || skipFileExistTest) {
    let sGitRepo = sGit(repoFullPath);  // open repository with simple-git
    sGitRepo.silent(true)   // activate silent mode to prevent fatal errors from getting logged to STDOUT
        .mv(filesource, filedestination)  //perform GIT MV operation
        .then(() => console.log('File move completed.'))
        .catch((err) => {
          displayModal('File move failed: ' + err);
          console.log("ERROR: file move failed. Full error: " + err);
        });
  }
  else{
    displayModal("Destination directory does not exist.");
  }
}

//This functions using simple git to find the ahead and behind number of commits
function unpushedCommitsModal() {
  let sGitRepo = sGit(repoFullPath);

  sGitRepo.silent(true).status().then((status: StatusSummary) => {

    document.getElementById("ahead_count").innerHTML = status.ahead;
    document.getElementById("behind_count").innerHTML = status.behind;

  });

}

//undo the latest unpush single commit using git reset --soft HEAD~1
//TODO support for undo any number of commit user want
function resetLastCommit()
{
  let sGitRepo = sGit(repoFullPath);
  sGitRepo.silent(true).reset(["HEAD~1"]).then((result) => {
    displayModal("Most recent unpush commit has been reset");
  } ).catch( function ( err )
  {
    alert("Reset Failed : "+ err.message );
    console.log( err );
  });
}
