import { Component } from "@angular/core";

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  lightweightTagSelected: boolean = false;

  constructor() {
    $(window).resize(this.disableContextMenu);
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

  doNothing() {
    
  }

  disableContextMenu() {
    let contextMenu = $("#networkContext");
    contextMenu.hide();
  }

  showCreateTagModal() {
    let modal = $("#createTagModal");
    modal.modal("show");
    this.disableContextMenu();
  }

  clickSubmitCreateTag(){
    let tagName = $("#inputTagName")[0].value;
    let pushTag = $("#inputPushTag")[0].checked;

    let tagMessage; // If tagMessage is undefined then we create a lightweight tag
    if (!this.lightweightTagSelected) {
      tagMessage = $("#inputTagMessage")[0].value;
    }
    
    createTag(tagName, getSelectedCommit(), pushTag, tagMessage);
  }

  clearCreateTagModal() {
    let inputTagName = $("#inputTagName")[0];
    inputTagName.value = inputTagName.defaultValue;

    let inputTagMessage = $("#inputTagMessage")[0];
    inputTagMessage.value = inputTagMessage.defaultValue;

    let inputPushTag = $("#inputPushTag")[0];
    inputPushTag.checked = inputPushTag.defaultChecked;

    let createTagError = $("#createTagError")[0];
    createTagError.innerHTML = "";
  }
}