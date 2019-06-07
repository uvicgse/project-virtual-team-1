import { Component } from "@angular/core";

@Component({
  selector: "pull-request-panel",
  templateUrl: "app/components/pullRequestPanel/pull.request.panel.component.html"
})

/**
 * This component contains the functionality
 * of the pull request panel.
 */
export class PullRequestPanelComponent {
  // Represents display status of entire component minus the side bar.
  isShowingPRPanel = false;

  // Represents display status of file diff for a given PR.
  isShowingFileDiff = false;

  /*
    Stores the base link for all the API calls
    in this component.
  */
  apiLink = "https://api.github.com/repos/"

  repoOwner = "";
  repoName = "";

  // Hides/unhides the PR panel based on it's current status.
  togglePRPanel(): void {
    let prStatus1 = document.getElementById("pr-status-1");
    let prStatus2 = document.getElementById("pr-status-2");
    if (prStatus1 != null && prStatus2 != null) {
      if (prStatus1.style.display === "none" && prStatus2.style.display === "none"){
        prStatus1.style.display = "block";
        prStatus2.style.display = "block";
        this.isShowingPRPanel = false;
        this.showPRPanel();
      } else {
        this.isShowingPRPanel ? this.hidePRPanel() : this.showPRPanel();
      }
    }
    
  }

  // Shows the PR panel in it's half extended state.
  showPRPanel() {
    this.halfExtendPRPanel();
    this.updatePRs();
  }

  // Hide the entire component minus side bar.
  hidePRPanel(): void {
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
      this.isShowingPRPanel = false;
    }

    this.resetFullPanel();
  }

  // This function gets the owner and name of the current repo.
  getRepoOwner(callback: () => void) {
    let gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
    let searchString = "[remote \"origin\"]";

    gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
    gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));

    let gitConfigFileSubstrings = gitConfigFileText.split('/');

    //If the remote branch was set up using ssh, separate the elements between colons"
    if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
      gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
    }

    this.repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2];
    this.repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1];

    let url = this.apiLink + this.repoOwner + "/" + this.repoName;
    this.gitHubGetRequest(url, (response) => {
      if (response.fork) {
        this.repoOwner = response.parent.owner.login;
      } else {
        this.repoOwner = this.repoOwner;
      }
      callback();
    });
  }

  // This function gets all open PRs for the repo.
  getPRs(callback: (pullRequests: any[]) => void): void {
    this.getRepoOwner(() => {
      let url = this.apiLink + this.repoOwner + "/" + this.repoName + "/pulls";
      this.gitHubGetRequest(url, (response) => {
        callback(response);
      });
    });
  }

  // This function adds a list of open repos to the UI. 
  populatePRPanel(pullRequests: any[]) {
    let prList = document.getElementById("pr-list");

    if (prList != null) {
      // Clear existing list.
      prList.innerHTML = "";

      pullRequests.forEach((pr) => {
        let listElement = document.createElement("li");
        let link = document.createElement("a");
        link.className = "list-group-item";
        listElement.setAttribute("role", "presentation");

        link.innerHTML = "PR #" + pr.number + ": " + pr.title;

        // Setup functionality for when a PR in the list is clicked.
        link.onclick = (e) => {
          this.resetFullPanel();
          this.getPRFileDiff(pr);
          this.fullExtendPRPanel();
          this.createInitialPRPost(pr, () => {
            // Get the comments on the PR.
            this.gitHubGetRequest(pr.comments_url, (response) => {
              response.forEach((comment: any) => {
                this.createCommentPost(comment);
              });
              this.createCommentInputArea(pr, () => {
                // Simulate a click to open the newly added PR.
                link.click();
              });
            });
          });
        };

        listElement.appendChild(link);

        prList!.appendChild(listElement);
      });
    }
  }

  /*
    This function creates the first post in a PR.
  */
  createInitialPRPost(pr: any, callback: () => void): void {
    let outerRow = document.createElement("div");
    outerRow.className = "row";

    let column = document.createElement("div");
    column.className = "col-sm-8 col-sm-offset-2";

    let card = document.createElement("div");
    card.className = "pr-card";

    let prTitle = document.createElement("h1");
    let prTitleText = document.createTextNode("Pull Request #" + pr.number + ": " + pr.title);
    prTitle.appendChild(prTitleText);

    let prAuthor = document.createElement("h5");
    let prAuthorText = document.createTextNode(pr.user.login + " wants to merge " + pr.head.label + " into " + pr.base.label + ".");

    prAuthor.appendChild(prAuthorText);

    let prBody = document.createElement("p");
    let prBodyText = document.createTextNode(pr.body);
    prBody.appendChild(prBodyText);

    card.appendChild(prTitle);
    card.appendChild(prAuthor);
    card.appendChild(prBody);

    column.appendChild(card);

    outerRow.appendChild(column);

    let prDiv = document.getElementById("pr-div");
    if (prDiv != null) {
      prDiv.appendChild(outerRow);
    }

    callback();
  }

  /*
    This function creates comment cards for PRs.
  */
  createCommentPost(comment: any): void {
    let outerRow = document.createElement("div");
    outerRow.className = "row";

    let column = document.createElement("div");
    column.className = "col-sm-8 col-sm-offset-2";

    let card = document.createElement("div");
    card.className = "pr-card";

    let commentAuthor = document.createElement("h5");
    let commentAuthorText = document.createTextNode(comment.user.login + " commented:");
    commentAuthor.appendChild(commentAuthorText);

    let commentBody = document.createElement("p");
    let commentBodyText = document.createTextNode(comment.body);
    commentBody.appendChild(commentBodyText);

    card.appendChild(commentAuthor);
    card.appendChild(commentBody);

    column.appendChild(card);

    outerRow.appendChild(column);

    let prDiv = document.getElementById("pr-div");
    if (prDiv != null) {
      prDiv.appendChild(outerRow);
    }
  }

  /*
    This function creates an area to input
    your own comments.
  */
  createCommentInputArea(pr: any, callback: () => void): void {
    let outerRow = document.createElement("div");
    outerRow.className = "row";

    let column = document.createElement("div");
    column.className = "col-sm-8 col-sm-offset-2";

    let card = document.createElement("div");
    card.className = "pr-card";

    let createComment = document.createElement("h3");
    let createCommentText = document.createTextNode("Add a comment: ");
    createComment.appendChild(createCommentText);


    let commentInput = document.createElement("textarea");
    commentInput.className = "pr-comment-panel";

    let submitButton = document.createElement("button");
    submitButton.innerText = "Submit Comment";
    submitButton.className = "btn btn-success pr-comment-submit";

    // Setting up comment submission.
    submitButton.onclick = (e) => {
      if (commentInput.value === "" || commentInput.value == null) {
        createCommentText.textContent = "Please enter a comment: ";
      } else {
        let data = {
          "body": commentInput.value,
          "in_reply_to": pr.id
        };
        let jsonData = JSON.stringify(data);

        // Posting new comment.
        let url = this.apiLink + this.repoOwner + "/" + this.repoName + "/issues/" + pr.number + "/comments";
        this.gitHubPostRequest(url, jsonData, (response) => {
          callback();
        });
      }
    };

    card.appendChild(createComment);
    card.appendChild(commentInput);
    card.appendChild(submitButton);

    column.appendChild(card);

    outerRow.appendChild(column);

    let prDiv = document.getElementById("pr-div");
    if (prDiv != null) {
      prDiv.appendChild(outerRow);
    }
  }

  /*
    This function creates a new PR.
  */
  createNewPullRequest() {
    let prFrom = <HTMLInputElement>document.getElementById("pr-from");
    let prTo = <HTMLInputElement>document.getElementById("pr-to");
    let prTitle = <HTMLInputElement>document.getElementById("pr-title");
    let prBody = <HTMLInputElement>document.getElementById("pr-body");

    if (prFrom != null && prTo != null && prTitle != null) {
      if (this.isValidPR(prFrom, prTo, prTitle)) {
        if (prBody != null) {
          let url = this.apiLink + this.repoOwner + "/" + this.repoName + "/pulls";
          let data = {
            "title": prTitle.value,
            "head": prFrom.value,
            "base": prTo.value,
            "body": prBody.value
          };

          let jsonData = JSON.stringify(data);

          // Posting new PR.
          this.gitHubPostRequest(url, jsonData, () => {
            this.updatePRs();
            prTitle.value = "";
            prBody.value = "";
          });
        }
      }

    }
  }

  /*
    This function checks if a newly created PR is
    valid and provides the user with feedback if it
    isn't.
  */
  isValidPR(prFrom: any, prTo: any, prTitle: any): boolean {
    let createPRText = <HTMLInputElement>document.getElementById("create-pr-text");
    if (prFrom.value === prTo.value) {
      if (createPRText != null) {
        createPRText.innerText = "Pick two different branches!"
      }
      return false;
    } else {
      createPRText.innerText = "Create a pull request"
    }

    let prTitleLabel = <HTMLInputElement>document.getElementById("new-pr-title");
    if (prTitle.value === "" || prTitle.value == null) {
      if (prTitleLabel != null) {
        prTitleLabel.innerText = "Please enter a title"
      }
      return false
    } else if (prTitleLabel != null) {
      prTitleLabel.innerText = "Title:"
    }

    return true;
  }

  /*
    This function updates the current list of PRs.
  */
  updatePRs(): void {
    this.getPRs((prs) => {
      this.populatePRPanel(prs);
    });

    this.getBranches((branches) => {
      let prTo = document.getElementById("pr-to");
      let prFrom = document.getElementById("pr-from");
      if (prTo != null && prFrom != null) {
        prTo.innerHTML = "";
        prFrom.innerHTML = "";
        branches.forEach((branch: any) => {
          let optionA = document.createElement("option");
          let optionTextA = document.createTextNode(branch.name);
          optionA.appendChild(optionTextA);
          optionA.value = branch.name;
          prTo!.appendChild(optionA);

          let optionB = document.createElement("option");
          let optionTextB = document.createTextNode(branch.name);
          optionB.appendChild(optionTextB);
          optionB.value = branch.name;
          prFrom!.appendChild(optionB);
        });
      }
    });
  }

  /*
    This function creates the HTML for file differences
    for a PR.
  */
  getPRFileDiff(pr: any): void {
    this.gitHubGetRequest(pr.diff_url, (response) => {
      let prDiff = document.getElementById("pr-diff");

      if (prDiff != null) {
        prDiff.innerHTML = Diff2Html.getPrettyHtml(response, { inputFormat: "diff", showFiles: true, matching: "lines" });
      }
    });
  }

  /*
    This function resets the status of the PR being displayed.
  */
  resetFullPanel(): void {
    let prDiv = document.getElementById("pr-div");
    let prDiff = document.getElementById("pr-diff");
    let prToggleButton = document.getElementById("pr-diff-button");

    if (prDiv != null && prDiff != null && prToggleButton != null) {
      prDiff.style.display = "none";
      prDiv.style.display = "block";
      prToggleButton.textContent = "Show file differences";
      this.isShowingFileDiff = false;
    }
  }

  /*
    This function changes between showing the current PR
    and it's file differences.
  */
  togglePRDiff(): void {
    let prDiff = document.getElementById("pr-diff");
    let prContent = document.getElementById("pr-div");
    let prToggleButton = document.getElementById("pr-diff-button");

    if (prDiff != null && prContent != null && prToggleButton != null) {
      if (!this.isShowingFileDiff) {
        prContent.style.display = "none";
        prDiff.style.display = "block";
        prToggleButton.innerText = "Hide file differences"
        this.isShowingFileDiff = true;
      } else {
        prContent.style.display = "block";
        prDiff.style.display = "none";
        prToggleButton.textContent = "Show file differences";
        this.isShowingFileDiff = false;
      }
    }
  }

  /*
    This function extends the component enough to see
    the list of PRs.
  */
  halfExtendPRPanel(): void {
    let prPanel = document.getElementById("pull-request-panel");
    let bodyPanel = document.getElementById("body-panel");
    let prListContainer = document.getElementById("pr-list-container");
    let prDisplayPanel = document.getElementById("pr-display-panel");

    if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
      prPanel.style.width = "20%";
      bodyPanel.style.width = "60%";
      prListContainer.style.width = "calc(100% - 60px)";
      prListContainer.style.display = "block";
      prDisplayPanel.style.display = "none";
      this.isShowingPRPanel = true;
    }
    this.resetFullPanel();
  }

  /*
    This function extends the component enough to see
    all of it.
  */
  fullExtendPRPanel(): void {
    let prPanel = document.getElementById("pull-request-panel");
    let bodyPanel = document.getElementById("body-panel");
    let prListContainer = document.getElementById("pr-list-container");
    let prDisplayPanel = document.getElementById("pr-display-panel");

    if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
      let prDiv = document.getElementById("pr-div");
      if (prDiv != null) {
        prDiv.innerHTML = "";
      }

      prPanel.style.width = "80%";
      bodyPanel.style.width = "0%";
      prListContainer.style.width = "25%";
      prDisplayPanel.style.width = "calc(75% - 60px)"
      prDisplayPanel.style.display = "block";
    }
  }

  /*
    This function gets the branches for this repo.
  */
  getBranches(callback: (response: any[]) => void) {
    this.getRepoOwner(() => {
      let url = this.apiLink + this.repoOwner + "/" + this.repoName + "/branches";
      this.gitHubGetRequest(url, (response) => {
        callback(response);
      });
    });
  }

  /*
    This function is a generic GET request to the
    GitHub APIs.
  */
  gitHubGetRequest(url: string, callback: (response: any) => void) {
    $.ajax({
      url: url,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', ' token ' + getAccessToken());

      },
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      },
      success: function (response: any) {
        callback(response);
      },
      error(xhr, status, error) {
        console.log("The XML Http Request of the GitHub API call is: ", xhr);
        console.log("The status of the GitHub API call is: ", status);
        console.log("The error of the GitHub API call is: ", error);
      }
    });
  }

  /*
    This function is a generic POST request to the
    GitHub APIs.
  */
  gitHubPostRequest(url: string, data: string, callback: (response: any) => void) {
    $.ajax({
      url: url,
      type: "POST",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', ' token ' + getAccessToken());
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      },
      contentType: "application/json",
      dataType: "json",
      data: data,
      success: function (response: any) {
        callback(response);
      },
      error(xhr, status, error) {
        console.log("The XML Http Request of the GitHub API call is: ", xhr);
        console.log("The status of the GitHub API call is: ", status);
        console.log("The error of the GitHub API call is: ", error);
      }
    });
  }

  resetComponent(): void{
    this.hidePRPanel();

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
}