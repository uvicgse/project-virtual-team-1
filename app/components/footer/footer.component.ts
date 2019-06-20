import { Component, Directive } from "@angular/core";
import { StashPanelComponent } from "../stashPanel/stash.panel.component";

@Component({
  selector: "app-footer",
  templateUrl: 'app/components/footer/footer.component.html',
  directives: [StashPanelComponent,]
})

export class FooterComponent {
  displayIssuePanel(): void {
    let issue = document.getElementById("issue-panel");
    displayIssues();
    if(issue != null) {
      issue.style.height = "100vh"
      issue.style.width = "100vw"
      issue.style.zIndex = "10";
    } 
  }
}
