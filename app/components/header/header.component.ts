import { Component } from "@angular/core";
import { RepositoryService } from "../../services/repository.service";
import { GraphService } from "../../services/graph.service";


@Component({
  selector: "app-header",
  templateUrl: 'app/components/header/header.component.html',
  providers: [RepositoryService, GraphService]
})

export class HeaderComponent   {
  repoName: string = "Repo name";
  repoBranch: string = "Repo branch";
  repository: any;

  // If 'branch' is the selected tab in the dropdown of references. False means that 'tag' is the selected tab. 
  branchSelectedInRefDropdown: boolean = true;

  promptUserToAddRepository(): void {
    switchToAddRepositoryPanel();
  }

  switchToMainPanel(): void {
    // Check if either the password/username or both fields are empty and show an icon and make the field red if they are
    if (document.getElementById('Password1').value == "" && document.getElementById('Email1').value == "") {
      this.emptyPassword();
      this.emptyUsername();
    } else if (document.getElementById('Password1').value == "") {
      this.emptyPassword();
      this.notEmptyUsername();
    } else if (document.getElementById('Email1').value == "") {
      this.emptyUsername();
      this.notEmptyPassword();
    } else {
      this.notEmptyPassword();
      this.notEmptyUsername();

      // Both the fields filled so check if they can log in
      signInHead(collapseSignPanel);
      document.getElementById("Email1").value = "";
      document.getElementById("Password1").value = "";
    }
  }

  WarningSignIn(): void {
    redirectToHomePage();
  }

  authenticateGithub(): void {
    authenticateUser(switchToAddRepositoryPanel);
  }

  showBranchList(): void {
    this.branchSelectedInRefDropdown = true
  }

  showTagList(): void {
    this.branchSelectedInRefDropdown = false
  }

  displayFileEditor(): void {
    let editor = document.getElementById("editor-panel");

    if (editor != null) {
      editor.style.height = "100vh"
      editor.style.width = "100vw"
      editor.style.zIndex = "10";
    }
  }
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
