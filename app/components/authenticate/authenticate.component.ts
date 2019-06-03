import { Component, OnInit, } from "@angular/core";

@Component({
  selector: "user-auth",
  templateUrl: 'app/components/authenticate/authenticate.component.html'
})

export class AuthenticateComponent implements OnInit {
  ngOnInit(): any {
    // useSavedCredentials returns true if there is a saved credential and uses it.
    if (useSavedCredentials()){
      console.log('Logging in With Saved Token');
    } 
  }

  switchToMainPanel(): void {
    // Check if either the password/username or both fields are empty and show an appropriate message if they are
    if (document.getElementById('password').value == "" && document.getElementById('username').value == "") {
      emptyPassword();
      emptyUsername();
    } else if (document.getElementById('password').value == "") {
      emptyPassword();
      notEmptyUsername();
    } else if (document.getElementById('username').value == "") {
      emptyUsername();
      notEmptyPassword();
    } else {
      // Both the fields filled so check if they can log in
      notEmptyPassword();
      notEmptyUsername();
      
      document.getElementById('grey-out').style.display = 'block';
      getUserInfo(switchToAddRepositoryPanel);
    }
  }
  
  authenticateGithub(): void {
    authenticateUser(switchToAddRepositoryPanel);
  }
}
