let fs = require('fs');
let cred;
let blue = "#39c0ba";
let gray = "#5b6969";
let continuedWithoutSignIn = false;
let inTheApp = false;

let showUsername = true;
let previousWindow = "repoPanel";

function collapseSignPanel() {
  $("#nav-collapse1").collapse("hide");
}

function switchToClonePanel() {
  console.log("switch to clone panel");
  hideAuthenticatePanel();
  hideFilePanel();
  hidePullRequestPanel();
  hideGraphPanel();
  hideFooter();
  displayClonePanel();
}

function switchToMainPanel() {
  hideAuthenticatePanel();
  hideAddRepositoryPanel();
  displayFilePanel();
  displayPullRequestPanel();
  displayFooter();
  displayGraphPanel();

  openDisabled = false;

  $("#nav-collapse1").collapse("hide");
  if(previousWindow == "repoPanel"){
    if(showUsername){
      document.getElementById("Button_Sign_out").style.display = "block";
      document.getElementById("Button_Sign_in").style.display="none";
    }else{
      document.getElementById("Button_Sign_out").style.display = "none";
    }
  }
  previousWindow = "mainPanel";
}

function checkSignedIn() {
  if (continuedWithoutSignIn) {
    displayModal("You need to sign in");
    // Don't open the repo modal
    $('#repo-name').removeAttr("data-target");
} else {
    // Ensure repo modal is connected
    let butt = document.getElementById("cloneButton");
    butt.disabled = true;
    butt.innerHTML = 'Clone';
    butt.setAttribute('class', 'btn btn-primary');
    $('#repo-name').attr("data-target", "#repo-modal");

  }
}

function checkIfInTheApp(){
  return inTheApp;
}

function switchToAddRepositoryPanelWhenNotSignedIn() {
  previousWindow = "repoPanel";
  continuedWithoutSignIn = true;
  showUsername = false;
  switchToAddRepositoryPanel();

}

function switchToAddRepositoryPanel() {
  inTheApp = true
  console.log("Switching to add repo panel");
  useRecentRepositories();
  hideFooter();
  hideAuthenticatePanel();
  hideFilePanel();
  hidePullRequestPanel();
  hideGraphPanel();
  displayAddRepositoryPanel();

  if(showUsername){
    document.getElementById("Button_Sign_out").style.display = "block";
    document.getElementById("Button_Sign_in").style.display = "none";
    displayUsername();
  }else{
    $("#nav-collapse1").collapse("hide");
    document.getElementById("Button_Sign_out").style.display = "none";
  }
  let repoOpen = <HTMLInputElement>document.getElementById("repoOpen");
  if (repoOpen != null){
    repoOpen.value = "";
  }
}

function hideSignInButton():void{

  if (getAccessToken()) {
    document.getElementById("Button_Sign_in").style.display = "none";
  }
  if(previousWindow!="repoPanel"){
    switchToMainPanel();
  }
}

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

function displayUsername() {
  console.log("Display Username called");
  document.getElementById("Button_Sign_out").style.display = "block";
  showUsername = true;
  console.log(getUsername());
  let githubname = document.getElementById("githubname");
  if (githubname != null){
    let existing_username = githubname.innerHTML;
    if (getUsername() != null && existing_username == null) {
      githubname.innerHTML = getUsername();
    }
  }
}

function displayClonePanel() {
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null){
    addRepositoryPanel.style.zIndex = "10";
  }
  $("#open-local-repository").hide();
}

function displayFilePanel() {
  let filePanel = document.getElementById("file-panel");
  if (filePanel != null){
    filePanel.style.zIndex = "10";
  }

  let commitMessageInput = document.getElementById("commit-message-input");
  if (commitMessageInput != null){
    commitMessageInput.style.visibility = "visible";
  }

  let commitButton = document.getElementById("commit-button");
  if (commitButton != null){
    commitButton.style.visibility = "visible";
  }

  let fileEditButton = document.getElementById("fileEdit-button");
  if (fileEditButton != null){
    fileEditButton.style.visibility = "visible";
  }
  document.getElementById("Issues-button").style="visiblity: visible";
}

function displayPullRequestPanel() {
  let prPanel = document.getElementById("pull-request-panel")
  if (prPanel != null) {
    prPanel.style.zIndex = "10";
  }
}

function hidePullRequestPanel() {
  let prPanel = document.getElementById("pull-request-panel")
  if (prPanel != null) {
    prPanel.style.zIndex = "-10";
  }
}

function displayGraphPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null){
    graphPanel.style.zIndex = "10";
  }
}

function displayAddRepositoryPanel() {
  previousWindow = "repoPanel";
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null) {
    addRepositoryPanel.style.zIndex = "10";
  }
  $("#open-local-repository").show();
}

function hideFilePanel() {
  let filePanel = document.getElementById("file-panel");
  if (filePanel != null){
    filePanel.style.zIndex = "-10";
  }

  let commitMessageInput = document.getElementById("commit-message-input");
  if (commitMessageInput != null){
    commitMessageInput.style.visibility = "hidden";
  }

  let commitButton = document.getElementById("commit-button");
  if (commitButton != null){
    commitButton.style.visibility = "hidden";
  }

  let fileEditButton = document.getElementById("fileEdit-button");
  if (fileEditButton != null){
    fileEditButton.style.visibility = "hidden";
  }
  document.getElementById("Issues-button").style="visibility: hidden";
}

function hideGraphPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.zIndex = "-10";
  }
}

function hideAddRepositoryPanel() {
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null) {
    addRepositoryPanel.style.zIndex = "-10";
  }
}

function displayDiffPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.width = "60%";
  }

  let diffPanel = document.getElementById("diff-panel");
  if (diffPanel != null) {
    diffPanel.style.width = "40%";
  }

  displayDiffPanelButtons();
}

function hideDiffPanel() {
  let diffPanel = document.getElementById("diff-panel");
  if (diffPanel != null) {
    diffPanel.style.width = "0";
  }

  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.width = "100%";
  }
  document.getElementById("diff-panel-body")!.innerHTML= '';

  disableDiffPanelEditOnHide();
  hideDiffPanelButtons();
}

function hideDiffPanelIfNoChange() {
  let filename = document.getElementById("diff-panel-file-name") == null ? null : document.getElementById("diff-panel-file-name")!.innerHTML;
  let filePaths = document.getElementsByClassName('file-path');
  let nochange = true;
  for (let i = 0; i < filePaths.length; i++) {
    if (filePaths[i].innerHTML === filename) {

      nochange = false;
    }
  }
  if (nochange == true){
    hideDiffPanel();
  }
  filename = null;
}

function hideAuthenticatePanel() {
  let authenticate = document.getElementById("authenticate");
  if (authenticate != null) {
    authenticate.style.zIndex = "-20";
  }
}

function displayAuthenticatePanel() {
  let authenticate = document.getElementById("authenticate");
  if (authenticate != null) {
    authenticate.style.zIndex = "20";
  }
}

function displayDiffPanelButtons() {
  let saveButton = document.getElementById("save-button");
  if (saveButton != null) {
    saveButton.style.visibility = "visible";
  }

  let cancelButton = document.getElementById("cancel-button");
  if (cancelButton != null) {
    cancelButton.style.visibility = "visible";
  }
  document.getElementById("open-editor-button")!.style.visibility = "visible";
  document.getElementById("rename-modal-button-diff")!.style.visibility = "visible";
  document.getElementById("move-modal-button-diff")!.style.visibility = "visible";

}

function hideDiffPanelButtons() {
  let saveButton = document.getElementById("save-button");
  if (saveButton != null) {
    saveButton.style.visibility = "hidden";
  }

  let cancelButton = document.getElementById("cancel-button");
  if (cancelButton != null) {
    cancelButton.style.visibility = "hidden";
  }
  document.getElementById("open-editor-button")!.style.visibility = "hidden";
  document.getElementById("rename-modal-button-diff")!.style.visibility = "hidden";
  document.getElementById("move-modal-button-diff")!.style.visibility = "hidden";

  disableSaveCancelButton();
  disableDiffPanelEditOnHide();
}

function hideFooter(){
  document.getElementById("terminal")!.style.visibility = "hidden";
  document.getElementById("stash-panel")!.style.visibility = "hidden";
}
function displayFooter(){
  document.getElementById("terminal")!.style.visibility = "visible";
  document.getElementById("stash-panel")!.style.visibility = "visible";
}

function disableSaveCancelButton() {
  let saveButton = <HTMLInputElement>document.getElementById("save-button");
  let cancelButton = <HTMLInputElement>document.getElementById("cancel-button");
  saveButton.disabled = true;
  saveButton.style.backgroundColor = gray;
  cancelButton.disabled = true;
  cancelButton.style.backgroundColor = gray;
}

function enableSaveCancelButton() {
  let saveButton = <HTMLInputElement>document.getElementById("save-button");
  let cancelButton = <HTMLInputElement>document.getElementById("cancel-button");
  saveButton.disabled = false;
  saveButton.style.backgroundColor = blue;
  cancelButton.disabled = false;
  cancelButton.style.backgroundColor = blue;
}

function disableDiffPanelEditOnHide() {
  let doc = document.getElementById("diff-panel-body");
  if (doc != null) {
    doc.contentEditable = "false";
  }
}

function useSavedCredentials() : boolean {
  let file = 'data.json';
  // check if the data.json file exists
  if (fs.existsSync(file)) {
    console.log('button has been pressed: logging in with saved credentials');
    decrypt();
    loginWithSaved(switchToMainPanel);
    return true;
  }
  return false;
}

// Issue 6
// Create repos.json file is it does not exist
function createRecentRepositories(file) {
    console.log('Creating recent repositories file: ' + file);
    try {
        fs.writeFileSync(file);
    } catch (err) {
        console.log(err);
    }
}

// Issue 6
// Check if repos.json exists
function useRecentRepositories() {
    let file = 'repos.json';

    if (!fs.existsSync(file)) {
        console.log(file + ' does not exist');
        createRecentRepositories(file);
    } else {
        console.log(file + ' exists')
    }
}
