import { Component } from "@angular/core";

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {

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
}
