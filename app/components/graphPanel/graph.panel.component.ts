import { Component } from "@angular/core";

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  lightweightTagSelected: boolean = false;

  constructor() {
    $(window).resize(this.disableContextMenu); // Handler for closing context menu when the window resizes
  }

  mergeBranches(): void {
    let p1 = document.getElementById('fromMerge').innerHTML;
    mergeCommits(p1);
  }

  rebaseBranches(): void {
    let p1 = document.getElementById('fromRebase').innerHTML;
    let p2 = document.getElementById('toRebase').innerHTML;
    rebaseCommits(p1, p2);
  }

  // Empty function. Used to replace event handlers with a noop.
  doNothing() {

  }

  resetRepoToCommit ()
  {
    resetLastCommit()
    let contextMenu = $("#networkContext");
    contextMenu.hide();
  }

  // Disables the context menu in the graphed network
  disableContextMenu() {
    let contextMenu = $("#networkContext");
    contextMenu.hide();
    var dropdown = $("#deleteTagList");
    dropdown.css("display", "none");
  }

  // Shows the modal for creating a new tag
  showCreateTagModal() {
    this.setCreateTagModal();

    let modal = $("#createTagModal");
    modal.modal("show");
    this.disableContextMenu();
  }

  // Handler for deleting tags from the graph
  showDeleteTagList() {
    var dropdown = $("#deleteTagList");
    if (dropdown.css("display") == "block" ) {
      dropdown.css("display", "none");
    } else {
      dropdown.css("display", "block");
    }
  }

  // Handler for a click on the create tag button in the create tag modal.
  clickSubmitCreateTag(){
    // Disable the submit button because the tag creation may take time, so we dont want multiple clicks
    $("#createTagModalCreateButton")[0].disabled = true;

    let tagName = $("#inputTagName")[0].value;
    let pushTag = $("#inputPushTag")[0].checked;

    let tagMessage; // If tagMessage is undefined then we create a lightweight tag
    if (!this.lightweightTagSelected) {
      tagMessage = $("#inputTagMessage")[0].value;
    }

    createTag(tagName, getSelectedCommit(), pushTag, tagMessage);
  }

  // Initializes the create tag modal. Should be called before displaying the modal.
  setCreateTagModal() {
    $("#createTagModalCreateButton")[0].disabled = false;

    let inputTagName = $("#inputTagName")[0];
    inputTagName.value = inputTagName.defaultValue;

    let inputTagMessage = $("#inputTagMessage")[0];
    inputTagMessage.value = inputTagMessage.defaultValue;

    let inputPushTag = $("#inputPushTag")[0];
    inputPushTag.checked = inputPushTag.defaultChecked;
    inputPushTag.disabled = signed ? false : true;
    inputPushTag.title = signed ? "" : "Must be signed in to push tags";

    let createTagError = $("#createTagError")[0];
    createTagError.innerHTML = "";
  }

  refreshGraph(): void {
    $("#refresh-graph-alert").hide();
    $("#refresh-button").show();
    drawGraph();
    updateModalText("Graph successfully refreshed");
  }
}
