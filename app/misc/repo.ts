let Git = require("nodegit");
let readFile = require("fs-sync");
let checkFile = require("fs");
let jsonfile = require('jsonfile');

let repoFullPath;
let repoLocalPath;
let bname = {};
let tags = {};
let remoteName = {};
let localBranches = [];
let repoCurrentBranch = "master";
let modal;
let span;
let contributors: [any] = [0];
let previousOpen;
let repoName : string = "";
let lastRefList = [];
let refreshAllFlagRef = false;
let detachedFlag = false;
let detachedRef;

// Issue 6
// Retrieve repos from repos.json
function getRecentRepositories() {
    let repoFile = 'repos.json';
    let repoList;

    try {
        repoList = JSON.parse(checkFile.readFileSync(repoFile));
    } catch (err) {
        console.log('ERROR: Cannot read file: ' + repoFile);
        repoList = {
            recentRepos: []
        }
    }

    // reverse for more understandable view
    displayList = repoList.recentRepos.reverse();
    return displayList;
}

// Issue 6
// Save repo entry to repos.json
function saveRecentRepositories(repoPath) {
    let repoFile = 'repos.json';
    let repoList;
    let recentRepos;

    try {
        repoList = JSON.parse(checkFile.readFileSync(repoFile));
    } catch (err) {
        console.log('ERROR: Cannot read file ' + repoFile);
        repoList = {
            recentRepos: []
        }
    }

    console.log('Updating recent repos.');
    updatedRepoList = {
        recentRepos: updateRecentRepos(repoList.recentRepos, repoPath)
    }

    try {
      jsonfile.writeFileSync(repoFile, updatedRepoList);
    } catch (err) {
      let recentRepoError = err;
      console.log("ERROR saving recent repository list: " + recentRepoError);
    }
}

// Issue 6
// Update recent repo list
function updateRecentRepos(recentRepos, repoToAdd) {
    let maxRepos = 5;

    if (recentRepos === undefined) {
        let newList = [repoToAdd];
        return newList;
    }

    for (let i = 0; i < recentRepos.length; i++) {
        if (recentRepos[i] === repoToAdd) {
            // using splice as suggested by:
            // https://stackoverflow.com/questions/15292278/how-do-i-remove-an-array-item-in-typescript
            recentRepos.splice(i, 1);
        }
    }
    recentRepos.push(repoToAdd);

    if (recentRepos.length > maxRepos) {
        console.log('Removing head of list.')
        recentRepos.splice(0, 1);
    }
    return recentRepos;
}

function downloadRepository() {
  let fullLocalPath;
  // Full path is determined by either handwritten directory or selected by file browser
  if (document.getElementById("repoSave").value != null || document.getElementById("repoSave").value != "") {
    // if the user entered a file location to save to
    // set that as the path
    fullLocalPath = document.getElementById("repoSave").value;

  } else {

    fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;
    console.log("Full repo path: " + repoFullPath);

  }

  let cloneURL = document.getElementById("repoClone").value;

  if (!cloneURL || cloneURL.length === 0) {
    updateModalText("Clone Failed - Empty URL Given");
    switchToAddRepositoryPanel();
  } else {
    downloadFunc(cloneURL, fullLocalPath);
    // save to recent repos
    saveRecentRepositories(fullLocalPath);
  }
}

function downloadFunc(cloneURL, fullLocalPath) {
  console.log("Path of cloning repo: " + fullLocalPath);

  let progressDiv = document.getElementById("cloneProgressDiv");
  progressDiv.style.visibility = "visible";

  let options = {};

  options = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1;
        },
        credentials: function () {
          return getCredentials();
        },
        transferProgress: function (data) {
          let bytesRatio = data.receivedObjects() / data.totalObjects();
          updateProgressBar(bytesRatio);
        }
      }
    }
  };

  console.log("Cloning into " + fullLocalPath);
  let repository = Git.Clone.clone(cloneURL, fullLocalPath, options)
    .then(function (repository) {
      progressDiv.style.visibility = 'collapse';
      updateProgressBar(0);
      console.log("Repo successfully cloned.");
      document.getElementById('graph-loading').style.display = 'block';
      updateModalText("Clone Successful, repository saved under: " + fullLocalPath);
      addCommand("git clone " + cloneURL + " " + fullLocalPath);
      repoFullPath = fullLocalPath;
      repoLocalPath = fullLocalPath;
      document.getElementById('graph-loading').style.display = 'block';
      refreshAll(repository);
      switchToMainPanel();
    },
      function (err) {
        progressDiv.style.visibility = 'collapse';
        updateProgressBar(0);
        updateModalText("Clone Failed - " + err);
        console.log("ERROR failed to clone repo: " + err); // TODO show error on screen
        switchToAddRepositoryPanel();
      });
}

function updateProgressBar(ratio) {
  let progressBar = document.getElementById("cloneProgressBar");
  let percentage = Math.floor(ratio * 100) + "%";
  progressBar.style.width = percentage;
  progressBar.innerHTML = percentage;
}

function openRepository() {
  console.log("Opening Repository...")
  if (document.getElementById("dirPickerOpenLocal").value === previousOpen && previousOpen != undefined) {
    return;
  }

  hidePRPanel();
  let fullLocalPath;
  let localPath;

    // Full path is determined by either handwritten directory or selected by file browser
    if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
      fullLocalPath = document.getElementById("dirPickerOpenLocal").files[0].path;
      localPath = fullLocalPath.replace(/^.*[\\\/]/, '');
      previousOpen = document.getElementById("dirPickerOpenLocal").value;
      document.getElementById("repoOpen").value = fullLocalPath;
      document.getElementById("repoOpen").text = fullLocalPath;
    } else {
      localPath = document.getElementById("repoOpen").value;
      if (checkFile.existsSync(localPath)) {
        fullLocalPath = localPath;
      } else {
        fullLocalPath = require("path").join(__dirname, localPath);
      }
    }

    console.log('Saving repository path...');
    saveRecentRepositories(fullLocalPath);

    console.log("Trying to open repository at " + fullLocalPath);
    displayModal("Opening Local Repository...");

    Git.Repository.open(fullLocalPath).then(function (repository) {
      repoFullPath = fullLocalPath;
      repoLocalPath = localPath;
      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("Current HEAD commit: " + tid);
      }
      //Reads the git config file and extracts info about the remote "origin" branch on GitHub
      if (readFile.exists(repoFullPath + "/.git/config")) {
        let gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
        let searchString = "[remote \"origin\"]";

        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
        gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));

        let gitConfigFileSubstrings = gitConfigFileText.split('/');

        //If the remote branch was set up using ssh, separate the elements between colons"
        if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
          gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
        }

        let repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2]
        repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1]
        //If the user is signed in, an API call can performed
        if (!continuedWithoutSignIn) {
          //Call to get all usernames
          $.ajax({
            url: "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contributors",
            type: "GET",
            beforeSend: function (xhr) {
              xhr.setRequestHeader('Authorization', ' token ' + getAccessToken());
            },
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            },
            success: function (response) {

              for (var i = 0; i < response.length; i++) {
                //Store list of logins here.
                contributors[i] = {
                  "username": response[i].login,
                  "name": "",
                  "email": ""
                }
              }
              console.log("The contributors for this project are ", contributors)
            },
            error(xhr, status, error) {
              console.log("The XML Http Request of the GitHub API call is: ", xhr);
              console.log("The status of the GitHub API call is: ", status);
              console.log("The error of the GitHub API call is: ", error);
            }
          })
        }

      }
      document.getElementById('graph-loading').style.display = 'block';
      refreshAll(repository);
      console.log("Repo successfully opened.");
      updateModalText("Repository successfully opened.");
    },
      function (err) {
        updateModalText("No repository found. Select a folder with a repository.");
        console.log("ERROR: cannot open repository: " + err); // TODO show error on screen
        switchToAddRepositoryPanel();
      });
    document.getElementById("dirPickerOpenLocal").value = "";
  }

  function createLocalRepository() {
    //console.log("createLocalRepo")
    if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == "") {
      document.getElementById("dirPickerCreateLocal").click();
      let localPath = document.getElementById("dirPickerCreateLocal").files[0].webkitRelativePath;
      let fullLocalPath = document.getElementById("dirPickerCreateLocal").files[0].path;
      document.getElementById("repoCreate").value = fullLocalPath;
      document.getElementById("repoCreate").text = fullLocalPath;
    } else {
      let localPath = document.getElementById("repoCreate").value;
      let fullLocalPath;
      if (!require('path').isAbsolute(localPath)) {
        updateModalText('The filepath is not valid. For OSX and Ubuntu the filepath should start with /, for Windows C:\\\\')
        return
      } else {
        if (checkFile.existsSync(localPath)) {
          fullLocalPath = localPath;
        } else {
          checkFile.mkdirSync(localPath);
          fullLocalPath = localPath;
        }
      }
    }

    //console.log("pre-git check")
    //console.log("fullLocalPath is " + fullLocalPath)
    //console.log(require("path").join(fullLocalPath,".git"));
    if (checkFile.existsSync(require("path").join(fullLocalPath, ".git"))) {
      //console.log("Is git repository already")
      updateModalText("This folder is already a git repository. Please try to open it instead.");
    } else {
      displayModal("creating repository at " + require("path").join(fullLocalPath, ".git"));
      Git.Repository.init(fullLocalPath, 0).then(function (repository) {
        repoFullPath = fullLocalPath;
        repoLocalPath = localPath;
        refreshAll(repository);
        //console.log("Repo successfully created");
        updateModalText("Repository successfully created");
        document.getElementById("repoCreate").value = "";
        document.getElementById("dirPickerCreateLocal").value = null;
        switchToMainPanel();
      },
        function (err) {
          updateModalText("Creating Failed - " + err);
          //console.log("ERROR cannot open repository: "+err); // TODO show error on screen
        });
    }

    // save file to repos
    saveRecentRepositories(fullLocalPath);
  }

  function addBranchestoNode(thisB: string) {
    let elem = document.getElementById("otherBranches");
    elem.innerHTML = '';
    for (let i = 0; i < localBranches.length; i++) {
      if (localBranches[i] !== thisB) {
        console.log("Local branch is: " + localBranches[i]);
        let li = document.createElement("li");
        let a = document.createElement("a");
        a.appendChild(document.createTextNode(localBranches[i]));
        a.setAttribute("tabindex", "0");
        a.setAttribute("href", "#");
        li.appendChild(a);
        elem.appendChild(li);
      }
    }
  }

// works as a monitor for any change to the reference list
function refreshReferences(verbose, force) {
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repo.getCurrentBranch()
        .then(function () {
          // grab the list
          return repo.getReferences(Git.Reference.TYPE.LISTALL);
        })
        .then(function (refList) {
          // ignore stash hidden branch
          // sort refList alphabetically to get uniform order of the list
          refList = refList.filter(function (value, index, arr) {
            return value.name() !== "refs/stash";
          }).sort();

          // Always update if forced
          if (!force) {
            // monitor any changes to reference list
            if (lastRefList.length === refList.length && lastRefList.every(function(value, index) { return value.name() === refList[index].name()})) {
              // no change to the ref list, do nothing
              return;
            }
          }

          // detects changes, refresh the lists
          console.log("Branch or tag changes detected... refreshing branch and tag list.");

          if (!refreshAllFlagRef) {
            // show refresh graph alert
            $("#refresh-graph-alert").show();
            $("#refresh-button").hide();
          } else {
            $("#refresh-graph-alert").hide();
            $("#refresh-button").show();
          }

          refreshAllFlagRef = false;

          bname = {};
          tags = {};
          clearBranchAndTagElement();
          for (let i = 0; i < refList.length; i++) {
            if (verbose) { console.log("Reference name: " + refList[i].name()); }
            //get simplified name
            let refName = refList[i].name().split("/")[refList[i].name().split("/").length - 1];

            Git.Reference.nameToId(repo, refList[i].name()).then(function (oid) {
              // Use oid
              if (refList[i].isRemote()) {
                // for remote branches add oid and branch name to remote branches map
                remoteName[refName] = oid;
              } else if (refList[i].isBranch()){
                if (verbose) { console.log(refName + ": adding branch to end of " + oid.tostrS()); }
                // add to list of branches
                if (oid.tostrS() in bname) {
                  bname[oid.tostrS()].push(refList[i]);
                } else {
                  bname[oid.tostrS()] = [refList[i]];
                }
              } else if (refList[i].isTag()){
                // use peel() to get real commit SHA string from oid
                refList[i].peel(Git.Object.TYPE.COMMIT)
                  .then(ref => Git.Commit.lookup(repo, ref.id()))
                  .then(function (commit) {
                      if (verbose) { console.log(refName + ": adding tag to end of " + commit.sha()); }
                      // add to list of tags
                      if (commit.sha() in tags) {
                          tags[commit.sha()].push(refList[i]);
                      } else {
                          tags[commit.sha()] = [refList[i]];
                      }
                  });
              } else{
                console.log("Unsupported reference: " + refList[i].name());
              }
            }, function (err) {
              console.log("ERROR: could not find referenced branch" + err);
            });

            // display branch list and tag list
            if (refList[i].isRemote()) {
              if (localBranches.indexOf(refName) < 0) {
                displayBranch(refName, "branch-item-list", "checkoutRemoteBranch(this)");
              }
            } else if (refList[i].isBranch()){
              localBranches.push(refName);
              displayBranch(refName, "branch-item-list", "checkoutLocalBranch(this)");
            } else if (refList[i].isTag()){
              displayTag(refName, "tag-item-list", "checkoutTag(\""+refList[i]+"\")");
            } else{
              console.log("ERROR: Unsupported reference: " + refList[i].name());
            }
          }

          // dealing with case where HEAD is detached at a commit
          if (detachedFlag) {
            let detachedOid = detachedRef.target().tostrS();
            if (detachedOid in bname) {
              bname[detachedOid].push(detachedRef);
            }
            else {
              bname[detachedOid] = [detachedRef];
            }
          }

          // update lastRefList
          lastRefList = refList.slice();
        })
    });
}

  function refreshAll(repository) {
    document.getElementById('graph-loading').style.display = 'block';
    let branch;
    lastRefList = [];
    let navRepoName = repoLocalPath;

    //Get the current branch from the repo
    repository.getCurrentBranch()
      .then(function (reference) {
        //Get the simplified name from the branch
        let branchParts = reference.name().split("/");
        console.log("Branch parts: " + branchParts);
        branch = branchParts[branchParts.length - 1];

        // checkout-tag special case: HEAD is detached at a commit
        if (branchParts == "HEAD") {
          // signalling the detached flag
          detachedFlag = true;
          let detachedCid = reference.target().tostrS();
          console.log("HEAD is detached at ["+detachedCid+"]");
          branch = branch + " detached at " + detachedCid;
          detachedRef = reference;
        } else {
          detachedFlag = false;
        }
      })
      .then(function () {
        // suppress commit detection alert
        refreshAllFlagRef = true;
        refreshAllFlagCommit = true;
        refreshReferences(true, true);
        checkCommitChange();
      })
      .then(function () {
        console.log("Updating the graph and the labels.");
        drawGraph();
        if (repoLocalPath.length > 20) {
            navRepoName = "..." + repoLocalPath.replace(/^.*[\\\/]/, '');
        }
        document.getElementById("repo-name").innerHTML = navRepoName;
        document.getElementById("branch-name").innerHTML = '<span id="name-selected">' + branch +'</span>' + '<span class="caret"></span>';
      }, function (err) {
        //If the repository has no commits, getCurrentBranch will throw an error.
        //Default values will be set for the branch labels
        window.alert("Warning:\n" +
          "No branches have been found in this repository.\n" +
          "This is likely because there have been no commits made.");
        console.log("No branches found. Setting default label values to master.");
        console.log("Updating the labels and graph.");
        drawGraph();
        document.getElementById("repo-name").innerHTML = navRepoName;
        //default label set to master
        document.getElementById("branch-name").innerHTML = '<span id="name-selected">' + "master" +'</span>' + '<span class="caret"></span>';
      });
  }

  // Displaying branches in a dropdown menu
  function getAllBranches() {
    let repos;
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        repos = repo;
        return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
      })
      .then(function (branchList) {
        clearBranchAndTagElement();
        for (let i = 0; i < branchList.length; i++) {
          console.log("Branch discovered: " + branchList[i]);
          let bp = branchList[i].split("/");
          if (bp[1] !== "remotes") {
            displayBranch(bp[bp.length - 1], "branch-dropdown", "checkoutLocalBranch(this)");
          }
          Git.Reference.nameToId(repos, branchList[i]).then(function (oid) {
            // Use oid
            console.log("Oid " + oid);
          });
        }
      });
  }

  function getOtherBranches() {
    let list;
    let repos;
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        repos = repo;
        return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
      })
      .then(function (branchList) {
        clearMergeElement();
        list = branchList;
      })
      .then(function () {
        return repos.getCurrentBranch()
      })
      .then(function (ref) {
        let name = ref.name().split("/");
        console.log("Merging remote branch with tracked local branch.");
        clearBranchAndTagElement();
        for (let i = 0; i < list.length; i++) {
          let bp = list[i].split("/");
          if (bp[1] !== "remotes" && bp[bp.length - 1] !== name[name.length - 1]) {
            displayBranch(bp[bp.length - 1], "merge-dropdown", "mergeLocalBranches(this)");
          }
        }
      })

  }

  function clearMergeElement() {
    let ul = document.getElementById("merge-dropdown");
    ul.innerHTML = '';
  }

  function clearBranchAndTagElement() {
    // clean input fields
    document.getElementById("branchName").value = '';
    document.getElementById("tag-name").value = '';

    // clean branch and tag list
    var selectMenuList = document.getElementsByClassName("select-menu-list");
    Array.prototype.forEach.call(selectMenuList, function (list) {
        list.innerHTML = '';
    });
  }

// Adding features to branch dropdown menu
  function displayBranch(name, id, onclick) {
    let ul = document.getElementById(id);
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.setAttribute("href", "#");
    a.setAttribute("class", "list-group-item");
    a.setAttribute("onclick", onclick + ";event.stopPropagation()");
    li.setAttribute("role", "presentation");
    a.appendChild(document.createTextNode(name));
    a.innerHTML = name;
    li.appendChild(a);
    if (id == "branch-item-list") {
      var isLocal = 0;
      var isRemote = 0;
      // Add a remote branch icon for remote branches
      Git.Repository.open(repoFullPath)
        .then(function (repo) {
          Git.Reference.list(repo).then(function (array) {
            if (array.includes("refs/remotes/origin/" + name)) {
              a.innerHTML += "<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'>";
              isRemote = 1
            }
          })
        })
      // Add a local branch icon for local branches
      Git.Repository.open(repoFullPath)
        .then(function (repo) {
          repo.getBranch(name).then(function () {
            a.innerHTML += "<img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>";
            isLocal = 1
          })
        })

      // Adding a delete button for each branch
      if (name.toLowerCase() != "master") {
        var button = document.createElement("Button");
        button.innerHTML = "Delete";
        button.classList.add('btn-danger');

        $(button).click(function () {
          // Only show valid delete branch button(s)
          if (isRemote && !isLocal) {
            document.getElementById("localDeleteButton").style.display = 'none';
            document.getElementById("remoteDeleteButton").style.display = '';
          }
          else if (isLocal && !isRemote) {
            document.getElementById("remoteDeleteButton").style.display = 'none';
            document.getElementById("localDeleteButton").style.display = '';
          }
          else {
            document.getElementById("localDeleteButton").style.display = '';
            document.getElementById("remoteDeleteButton").style.display = '';
          }

          $('#branch-to-delete').val(name);
          document.getElementById("displayedBranchName").innerHTML = name;
          $('#delete-branch-modal').modal(); // Display delete branch warning modal
        });
        li.appendChild(button); // Add delete button to the branch dropdown list
      }
    }
    ul.appendChild(li);
  }

  // Adding tags to branch dropdown menu
  function displayTag(name, id, onclick) {

    // create HTML element for tag list dropdown
    let tagList = document.getElementById(id);
    let li = document.createElement("li");
    let a = document.createElement("a");
    let span = document.createElement("span");
    let button = document.createElement("span");

    // set HTML attributes
    a.setAttribute("href", "#");
    a.setAttribute("class", "list-group-item tag-list-item");
    a.setAttribute("id", name);
    a.setAttribute("onclick", onclick + ";event.stopPropagation();");
    li.setAttribute("role", "presentation");
    span.setAttribute("class", "pull-right");
    button.setAttribute("id", name);
    button.setAttribute("class", "btn btn-danger");
    button.innerHTML = "Delete";

    // display tag in delete list on graph
    var deleteDropdownList = document.getElementById("deleteTagList");
    var deleteChilds = deleteDropdownList.childNodes;
    var createNewDelTag = true;
    for(let i = 0; i < deleteChilds.length; i++) {
      if(deleteChilds[i].firstChild.innerHTML == name) {
        createNewDelTag = false;
      }
    }

    // if the tag is not in the delete list, create a new list item
    if (createNewDelTag) {
      displayTagDeleteList(name);
    }

    // deleting a tag
    button.onclick = (event) => {

      // get name of tag from event
      let tagName = event.srcElement.getAttribute("id");

      let repo;
      Git.Repository.open(repoFullPath)
        .then(function(repoParam) {
          repo = repoParam;
        })
        .then(function(){
          return Git.Tag.delete(repo, tagName);
        }
      ).catch(function(msg) {
        let errorMessage = "Error: " + msg.message;
      });
    };

    // create tag element in list
    span.appendChild(button);
    a.appendChild(document.createTextNode(id));
    a.innerHTML = name;
    a.appendChild(span);
    li.appendChild(a);
    tagList.appendChild(li);
  }

  // populate delete tag dropdown
  function displayTagDeleteList(name) {

    // create HTML element for tag list dropdown
    var parentDropdownList = document.getElementById("deleteTagList");
    var li = document.createElement("li");
    var a = document.createElement("a");

    // set HTML attributes
    li.setAttribute("class", "list-item delete-list-item");
    a.innerHTML = name;

    // deleting a tag
    li.onclick = () => {

      updateModalText("Tag successfully deleted - refresh to see the updated graph. ");

      let repo;
      Git.Repository.open(repoFullPath)
        .then(function(repoParam) {
          repo = repoParam;
        })
        .then(function(){
          return Git.Tag.delete(repo, name);
        }
      ).catch(function(msg) {
        let errorMessage = "Error: " + msg.message;
      });

      var parentList = document.getElementById("deleteTagList");
      var deleteChildren = parentList.childNodes;
      for(let i = 0; i < deleteChildren.length; i++) {
        if (deleteChildren[i].firstChild.innerHTML == name) {
          deleteChildren[i].remove();
        }
      }
    };
    li.appendChild(a);
    parentDropdownList.appendChild(li);
  }

  function createDropDownFork(name, id) {
    let ul = document.getElementById(id);
    let button = document.createElement("div");
    let div = document.createElement("ul");
    let innerText = document.createTextNode(name + " (Forked List)");
    button.className = name;
    button.appendChild(innerText);

    let icon = document.createElement("i");
    icon.style.cssFloat = "right";
    icon.style.marginRight = "20px";
    icon.className = "fa fa-window-minimize";

    button.appendChild(icon);

    div.setAttribute("id", name);
    div.setAttribute("role", "menu");
    div.setAttribute("class", "list-group");
    button.onclick = (e) => {
      showDropDown(button);
      icon.className === "fa fa-window-minimize" ? icon.className = "fa fa-plus" : icon.className = "fa fa-window-minimize";
    }
    button.appendChild(div);
    ul.appendChild(button);
  }

  function showDropDown(ele) {
    //If the forked Repo is clicked collapse or uncollapse the forked repo list
    let div = document.getElementById(ele.className);
    if (div.style.display === 'none') {
      div.style.display = 'block';
    }
    else {
      div.style.display = 'none';
    }

  }
  
  function checkoutLocalBranch(element) {
    let button;   // entry in branch drop-down
    let img = "<img";
    if (typeof element === "string") {
      button = element;
    } else {
      button = element.innerHTML;
    }
    if (button.includes(img)) {
      button = button.substr(0, button.lastIndexOf(img)); // remove local branch <img> tag from branch name string
      if (button.includes(img)) {
        button = button.substr(0, button.lastIndexOf(img)) // remove remote branch <img> tag from branch name string
      }
    }
    
    console.log("name of branch being checked out: " + button);

    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        document.getElementById('graph-loading').style.display = 'block';
        addCommand("git checkout " + button);
        repo.checkoutBranch("refs/heads/" + button)
          .then(function () {
            refreshAll(repo);
          }, function (err) {
            console.log("ERROR: cannot checkout local branch: " + err);
          });
      })
  }

  // checkout tag function
  function checkoutTag(element) {
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        document.getElementById('graph-loading').style.display = 'block';
        addCommand("git checkout " + element);

        repo.setHead(element)
          .then(function () {
            refreshAll(repo);
          }, function (err) {
            console.log("repo.ts, cannot checkout local tag: " + err);
            displayModal("ERROR: cannot checkout local tag " + element);
            refreshAll(repo);
          });
      });
  }

  function checkoutRemoteBranch(element) {
    let button;   // entry in branch drop-down
    let img = "<img";
    if (typeof element === "string") {
      button = element;
    } else {
      button = element.innerHTML;
    }
    if (button.includes(img)) {
      button = button.substr(0, button.lastIndexOf(img)); // remove remote branch <img> tag from branch name string
      if (button.includes(img)) {
        button = button.substr(0, button.lastIndexOf(img))  // remove local branch <img> tag from branch name string
      }
    }

    console.log("current branch name: " + button);

    let repos;
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        repos = repo;
        addCommand("git fetch");

        addCommand("git checkout -b " + button);
        let cid = remoteName[button];
        console.log("name of remote branch:  " + cid);
        return Git.Commit.lookup(repo, cid);
      })
      .then(function (commit) {
        console.log("commiting");
        return Git.Branch.create(repos, button, commit, 0);
      })
      .then(function (code) {
        console.log("name of local branch " + button);
        repos.mergeBranches(button, "origin/" + button)

          .then(function () {
            document.getElementById('graph-loading').style.display = 'block';
            refreshAll(repos);
            console.log("Pull successful.");
          });
      }, function (err) {
        console.log("ERROR: could not pull from repository" + err);
      })
  }

  function updateLocalPath() {
    let fullLocalPath;
    // get the name of the repo from the usere entered URL
    let text = document.getElementById("repoClone").value;
    let splitText = text.split(/\.|:|\//);


    if (splitText[splitText.length - 1] == "git") {
      // Get the path location for this local folder, and join it with the repo name (from the URL)
      fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 2]);
      updateRepoSaveText(fullLocalPath);
    } else {
      // Get the path location for this local folder, and join it with the repo name (from the URL)
      fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 1]);
      updateRepoSaveText(fullLocalPath);
    }
  }

  // This function updates the repoSave text field
  function updateRepoSaveText(fullLocalPath) {
    document.getElementById("repoSave").value = fullLocalPath;
    document.getElementById("repoSave").text = fullLocalPath;
  }

  // This function helps display the users chosen folder location on repoSave
  function chooseLocalPath() {
    if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
      window.alert("Please enter the URL of the repository you wish to clone");
    } else {
      // get the name of the repo from the usere entered URL
      let text = document.getElementById("repoClone").value;
      let splitText = text.split(/\.|:|\//);
      let fullLocalPath;

      // get the users selected folder
      localPath = document.getElementById("dirPickerSaveNew").files[0].webkitRelativePath;
      fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;

      // display the new folder location on repoSave text field
      updateRepoSaveText(fullLocalPath);
    }
  }

  // function initModal() {
  //   modal = document.getElementById("modal");
  //   btn = document.getElementById("new-repo-button");
  //   confirmBtn = document.getElementById("confirm-button");
  //   span = document.getElementsByClassName("close")[0];
  // }

  // function handleModal() {
  //   // When the user clicks on <span> (x), close the modal
  //   span.onclick = function() {
  //     modal.style.display = "none";
  //   };
  //
  //   // When the user clicks anywhere outside of the modal, close it
  //   window.onclick = function(event) {
  //
  //     if (event.target === modal) {
  //       modal.style.display = "none";
  //     }
  //   };
  // }

  function displayModal(text) {
    //  initModal();
    //  handleModal();
    document.getElementById("modal-text-box").innerHTML = text;
    $('#modal').modal('show');
  }

  function updateModalText(text) {
    document.getElementById("modal-text-box").innerHTML = text;
    $('#modal').modal('show');
  }

  function hidePRPanel(): void{
    // Hide PR Panel
    let prStatus1 = document.getElementById("pr-status-1");
    let prStatus2 = document.getElementById("pr-status-2");
    if (prStatus1 != null && prStatus2 != null) {
        prStatus1.style.display = "none";
        prStatus2.style.display = "none";
    }

    let prPanel = document.getElementById("pull-request-panel");
    let bodyPanel = document.getElementById("body-panel");
    let prListContainer = document.getElementById("pr-list-container");
    let prDisplayPanel = document.getElementById("pr-display-panel");

    if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
      prPanel.style.width = "60px";
      prListContainer.style.display = "none";

      /*
        Calulates space leftover for the body panel after
        accounting for the space taken up by the side panel.
      */
      bodyPanel.style.width = "calc(80% - 60px)";

      prDisplayPanel.style.display = "none";
    }

    let prDiv = document.getElementById("pr-div");
    if (prDiv != null) {
      prDiv.innerHTML = "";
    }

    let prDiff = document.getElementById("pr-diff");
    if (prDiff != null) {
      prDiff.innerHTML = "";
    }

    let prList = document.getElementById("pr-list");
    if (prList != null) {
      prList.innerHTML = "";
    }

    let prFrom = document.getElementById("pr-from");
    if (prFrom != null) {
      prFrom.innerHTML = "";
    }

    let prTo = document.getElementById("pr-to");
    if (prTo != null) {
      prTo.innerHTML = "";
    }
  }
