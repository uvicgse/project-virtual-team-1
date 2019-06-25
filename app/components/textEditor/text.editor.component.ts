import { Component } from "@angular/core";

@Component({
  selector: "editor-panel",
  templateUrl: "app/components/textEditor/text.editor.component.html"
})

/**
 * This component contains the HTML and functionality
 * of the text editor.
 */
export class TextEditorComponent {
  // Stores the last key pressed by the user.
  currentKey: string;

  // True when the last change was cut or paste.
  cutPastePressed = false;

  // True when the line text area is being populated.
  changingLines: boolean;

  // Amount of spaces to be added on 'Tab' press.
  numberOfSpacesToIndent = 4;

  // Stores number of files that have been opened in this session.
  latestFileId = 0;

  // Stores the id of the currently open file tab.
  currentFileId = 0;

  // Stores a list of file paths.
  filePaths: [string] = [""];

  // This function is used to open files.
  openFile(): void {
    // Get the upload input element and then click it.
    let fileOpenInput = document.getElementById("file-upload");
    if (fileOpenInput != null) {
      fileOpenInput.click();
    }
  }

  // This function is used to rename files.
  renameFile(): void {
    // Get the rename input element and then click it.
    let fileRenameInput = document.getElementById("rename-filepicker-editor");
    if (fileRenameInput != null) {
      fileRenameInput.value = "";
      fileRenameInput.click();
    }
  }

  // This function is used to move files.
  moveFile(): void {
    // Get the move input element and then click it.
    let fileMoveInput = document.getElementById("move-filepicker-editor");
    if (fileMoveInput != null) {
      fileMoveInput.value = "";
      fileMoveInput.click();
    }
  }

  /*
    This function is called when a file is uploaded.
    It's purpose is to create a tab for the new file
    and fill the file text area with the file contents.
  */
  newFileUpload(): void {
    let reader = new FileReader();

    // The input where the opened file is located.
    let fileOpenInput = document.getElementById("file-upload");

    if (fileOpenInput != null) {
      let files = (<HTMLInputElement>fileOpenInput).files!;

      if (files != null) {
        // Set current filename for file rename modal dialog
        document.getElementById("currentFilename")!.innerHTML = (<HTMLInputElement>fileOpenInput).files[0].webkitRelativePath;
        (<HTMLInputElement>document.getElementById("renameFilename")!).value = (<HTMLInputElement>fileOpenInput).files[0].webkitRelativePath;

        // This runs when the reader has finished reading the file.
        reader.onload = (e) => {
          this.latestFileId++;
          this.createFileEditor();
          let fileTextArea = document.getElementById("file-text-area-" + this.latestFileId);
          if (fileTextArea != null && reader.result != null) {
            // Add the file text to the editor and create lines.
            (<HTMLInputElement>fileTextArea).value = (<string>reader.result);
            this.createLineNumbers();
            let file = files[0];
            this.filePaths[this.latestFileId] = file.path;
            this.createFileTab(file.name);
            this.currentFileId = this.latestFileId;
          }
        }

        // Start reading the uploaded file.
        reader.readAsText(files[0]);
      }
    }
  }

  /*
    This function is used to close the editor and return
    to the main screen.
  */
  closeEditor(): void {
    // Hide editor panel.
    let editor = document.getElementById("editor-panel")!;
    editor.style.height = "0vh";
    editor.style.width = "0vw";
    editor.style.zIndex = "-10";

    // Reset inputted file
    let inputFile = <HTMLInputElement>document.getElementById("file-upload");
    if (inputFile != null) {
      inputFile.value = "";
    }

    // Reset editor.
    let fileTabs = document.getElementById("file-tab")!;
    fileTabs.innerHTML = "";

    let fileEditors = document.getElementById("file-editors")!;
    fileEditors.innerHTML = "";

    // Reset variables.
    this.currentKey = "";
    this.cutPastePressed = false;
    this.changingLines = false;
    this.latestFileId = 0;
    this.currentFileId = 0;
    this.filePaths = [""];
  }

  /*
  This function is used to hide the editor and return
  to the main screen.
*/
  hideEditor(): void {
    // Hide editor panel.
    let editor = document.getElementById("editor-panel")!;
    editor.style.height = "0vh";
    editor.style.width = "0vw";
    editor.style.zIndex = "-10";
  }

  /*
    This function is used to switch between different file tabs
  */
  switchTab(fileTabId: string, fileId: string): void {
    // Update currently open file.
    this.currentFileId = parseInt(fileId);

    // Declare all variables
    let i = 0;
    let tabcontent: HTMLCollectionOf<Element>;
    let tablinks: HTMLCollectionOf<Element>;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      (<HTMLElement>tabcontent[i]).style.display = "none";
    }

    /*
      Get all elements with class="tablinks", containing file text
      and remove the class "active".
    */
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    /*
      Show the clicked file tab, and add an "active" class to the
      button that opened the tab
    */
    let fileIdElement = document.getElementById(fileId);
    if (fileIdElement != null) {
      fileIdElement.style.display = "block";
      let selectedTab = document.getElementById(fileTabId)!;
      selectedTab.className += " active";
    }

    // Fill line numbers for this tab.
    this.createLineNumbers();
  }

  /*
    This function helps to synchronise scrolling between
    the editor text area and the line counter text area.
  */
  scrollSync(): void {
    let lineTextArea = document.getElementById("line-text-area-" + this.currentFileId);
    let fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);
    if (lineTextArea != null && fileTextArea != null) {
      lineTextArea.scrollTop = fileTextArea.scrollTop;
    }
  }

  /*
    This function fills the line text area with the appropriate
    line numbers.
  */
  createLineNumbers(): void {
    // If this function is already running, return.
    if (this.changingLines) {
      return;
    }

    // The function has started running.
    this.changingLines = true;

    let i = 0;
    let lineNumberString = ''
    let lineTextArea = document.getElementById("line-text-area-" + this.currentFileId);
    let fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);

    /*
      If the elements were found, create a string of numbers
      corresponding to the number of lines in the editor.
    */
    if (lineTextArea != null && fileTextArea != null) {
      let fileText = (<HTMLInputElement>fileTextArea).value
      let numberOfLineBreaks = (fileText.match(/\n/g) || []).length;
      for (i = 0; i < numberOfLineBreaks + 1; i++) {
        lineNumberString = lineNumberString + (i + '\r\n');
      }
      (<HTMLInputElement>lineTextArea).value = lineNumberString;
    }

    // The function has finished running.
    this.changingLines = false;
  }

  /*
    Store the last key pressed. Required to decide when
    to repopulate the line numbers.
  */
  keyPressed(event: KeyboardEvent): void {
    this.currentKey = <string>event.key;

    /*
      When tab is pressed, override default behaviour and
      insert specified number of spaces instead.
    */
    if (event.key == "Tab") {
      event.preventDefault();
      let fileTextArea = <HTMLInputElement>document.getElementById("file-text-area-" + this.currentFileId);

      // Current cursor location.
      let selectionStart = fileTextArea.selectionStart;

      // Cursor location after current edit.
      let selectionEnd = fileTextArea.selectionEnd;
      if (selectionStart != null && selectionEnd != null) {
        // Everything before the cursor + amount of spaces + everything after cursor end point.
        fileTextArea.value = fileTextArea.value.substring(0, selectionStart) + " ".repeat(this.numberOfSpacesToIndent) + fileTextArea.value.substring(selectionEnd);

        // Move cursor forward by amount of spaces added.
        fileTextArea.selectionStart = fileTextArea.selectionEnd = selectionStart + this.numberOfSpacesToIndent;
      }
    } else if (event.ctrlKey || event.metaKey) {
      // When Ctrl+S is pressed, save file.
      if (event.key == "s") {
        event.preventDefault();
        this.saveFile();
      }
    }
  }

  /*
    This function is called whenever there is a change in
    the file text area. It repopulates the line numbers
    depending on what action the user takes.
  */
  valueChanged(): void {
    if (this.currentKey == "Enter" || this.currentKey == "Backspace" || this.currentKey == "Delete" || this.cutPastePressed) {
      this.createLineNumbers();
      this.cutPastePressed = false;
    }
    // Change save button back to 'Save' on value change.
    let saveButton = document.getElementById("save-button");
    if (saveButton != null) {
      saveButton.innerHTML = "Save";
    }

    let fileTab = document.getElementById("tab-link-" + this.currentFileId)!;
    if (fileTab.innerHTML.slice(-1) != "*") {
      fileTab.innerHTML += " *";
    }
  }

  /*
    Update the number of spaces to indent based
    on selection.
  */
  updateIndentAmount(): void {
    let selector = <HTMLInputElement>document.getElementById("selected-indent");
    this.numberOfSpacesToIndent = parseInt(selector.value);
  }

  /*
    Get content of text area and file name and
    save the contents.
  */
  saveFile(): void {
    let saveButton = document.getElementById("save-button");

    // Give user feedback that save is occuring.
    if (saveButton != null) {
      saveButton.innerHTML = "Saving...";
    }

    // Get current content.
    let fileTextArea = <HTMLInputElement>document.getElementById("file-text-area-" + this.currentFileId);

    if (fileTextArea != null) {
      // Save file.
      saveEditedFile(this.filePaths[this.currentFileId], fileTextArea.value, this.saveSuccess);
      let fileTab = document.getElementById("tab-link-" + this.currentFileId)!;
      if (fileTab.innerHTML.slice(-1) == "*") {
        fileTab.innerHTML = fileTab.innerHTML.substr(0, fileTab.innerHTML.indexOf(" *"));
      }
    } else if (saveButton != null) {
      saveButton.innerHTML = "Save";
    }
  }

  /*
    This function sets current and default filename for the file rename dialog before opening the modal dialog
   */
  renameFileFromEditor(event?: Event):void {
    if (event){
      (<HTMLInputElement>document.getElementById("currentFilename")!).innerHTML = event.target.files[0].path;
      (<HTMLInputElement>document.getElementById("renameFilename")!).value = event.target.files[0].path;
      $('#rename-file-modal').modal('show');
    }
  }

  /*
This function sets current and default folder for the file move dialog before opening the modal dialog
 */
  moveFileFromEditor(event?: Event):void {
    if (event) {
      (<HTMLInputElement>document.getElementById("currentFilename")!).innerHTML = event.target.files[0].path;
      (<HTMLInputElement>document.getElementById("currentFolderPath")!).innerHTML = repoFullPath;
      (<HTMLInputElement>document.getElementById("moveFileToFolder")!).value = repoFullPath;
      $('#move-file-modal').modal('show');
    }
  }

  /*
    This function gives user feedback after attempting to
    save the file.
  */
  saveSuccess(err: any): void {
    if (err) {
      // Inform user of error.
      displayModal("An error occured when saving, please try again.");
      let savingError = err;
      console.log("ERROR while saving: " + savingError);
    } else {
      // Change save button to saved, remove star next to filename
      let saveButton = document.getElementById("save-button");
      if (saveButton != null) {
        saveButton.innerHTML = "Saved";
      }
    }
  }

  /*
    Creates a tab for the newly opened file and focuses
    the editor on this tab.
  */
  createFileTab(fileName: string): void {
    // Get div where tabs are stored.
    let tabs = document.getElementById("file-tab")!;

    // Create new tab.
    let newTab = document.createElement("button");
    newTab.className = "tablinks";
    newTab.id = "tab-link-" + this.latestFileId;

    let closingTab = false;

    let id = "" + this.latestFileId;
    let closeIcon = document.createElement("i");
    closeIcon.className = "fa fa-times"
    closeIcon.onclick = (e) => {
      closingTab = true;
      let fileEditor = document.getElementById(id)!;
      fileEditor.remove();
      newTab.remove();
    }
    closeIcon.style.marginLeft = "5px";

    newTab.innerHTML = fileName;
    newTab.appendChild(closeIcon);

    // Store function to be called when the tab is clicked.
    let fileTabId = "tab-link-" + this.latestFileId;
    let fileId = "" + this.latestFileId;
    newTab.onclick = (e) => {
      if (!closingTab) {
        this.switchTab(fileTabId, fileId);
      }
    };

    // Add tab to the tab div.
    tabs.appendChild(newTab);

    // Focus on the new tab.
    this.switchTab("tab-link-" + this.latestFileId, "" + this.latestFileId);
  }

  /*
    Creates an text area for the newly opened file.
  */
  createFileEditor(): void {
    // Get div where editors are stored.
    let editors = document.getElementById("file-editors")!;

    // Create div for new editor
    let newEditorDiv = document.createElement("div");
    newEditorDiv.id = "" + this.latestFileId;
    newEditorDiv.className = "tabcontent";

    // Create a div for the file and line text areas.
    let newEditorArea = document.createElement("div");
    newEditorArea.className = "editor-area";

    // Create the line text area for this file.
    let lineTextArea = document.createElement("textarea");
    lineTextArea.className = "lines";
    lineTextArea.readOnly = true;
    lineTextArea.id = "line-text-area-" + this.latestFileId;

    // Create the file editor area for this file.
    let fileTextArea = document.createElement("textarea");
    fileTextArea.className = "file";
    fileTextArea.id = "file-text-area-" + this.latestFileId;
    fileTextArea.onclick = (e) => {
      this.createLineNumbers();
    }
    fileTextArea.onscroll = (e) => {
      this.scrollSync();
    }
    fileTextArea.onkeydown = (e) => {
      this.keyPressed(e);
    }
    fileTextArea.oninput = (e) => {
      this.valueChanged();
    }
    fileTextArea.oncut = (e) => {
      this.cutPastePressed = true;
    }
    fileTextArea.oncut = (e) => {
      this.cutPastePressed = true;
    }

    // Putting elements together.
    newEditorArea.appendChild(lineTextArea);
    newEditorArea.appendChild(fileTextArea);
    newEditorDiv.appendChild(newEditorArea);
    editors.appendChild(newEditorDiv);
  }

  /*
    Opens the file in the diff panel in the text editor
  */
  openDiffFile(fileName, filePath, fileContents) {
    this.latestFileId++;
    this.createFileEditor();
    let fileTextArea = document.getElementById("file-text-area-" + this.latestFileId);

    if (fileTextArea != null) {
      // Add the file text to the editor and create lines.
      (<HTMLInputElement>fileTextArea).value = (<string>fileContents);
      this.createLineNumbers();
      this.filePaths[this.latestFileId] = filePath;
      this.createFileTab(fileName);
      this.currentFileId = this.latestFileId;
    }
  }
}
