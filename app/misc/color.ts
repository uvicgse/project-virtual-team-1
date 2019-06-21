let before = 'default';

function changeColor(color) {
  const userSettingsDirectory = ".settings/";
  const userColorFilePath = userSettingsDirectory + "user_color.txt";

  // Check if .settings/ exists and make it if it doesn't
  if (!fs.existsSync(userSettingsDirectory)) {
    fs.mkdir(userSettingsDirectory,(err) => {
      if (err) throw err;
    });
  }

  // Save user color selection
  if (color != null) {
    fs.writeFile(userColorFilePath, color, function(err) {
        if (err) console.log("ERROR cannot write colour to file. Reason: " + err);
    });
  }

  let head = document.getElementsByClassName('navbar');
  let headButton = document.getElementsByClassName('navbar-btn');
  let fa = document.getElementsByClassName('fa');
  let fp = document.getElementById('file-panel');
  let p = document.getElementsByTagName('p');
  let h1 = document.getElementsByTagName('h1');
  let diffp = document.getElementById('diff-panel-body');
  let network = document.getElementById('my-network');
  let footer = document.getElementById('footer');
  let arp = document.getElementById('add-repository-panel');
  let auth = document.getElementById('authenticate');
  let repoName = document.getElementById ('repo-name');
  let branchName = document.getElementById('branch-name');
  let modifiedMessageColor = document.getElementById('modified-files-message');
  let stagedMessageColor = document.getElementById('staged-files-message');
  let modifiedTitle = document.getElementById('unstaged-files-heading');
  let stagedTitle = document.getElementById('staged-files-heading');
  let diffPanel = document.getElementById('diff-panel');
  let diffChangePopUp = document.getElementById('selected-commit-diff-panel');
  let commitDiffPanel = document.getElementById('commit-diff-panel-body');
  let diffChangePanelText = document.getElementsByClassName('diffChangeText');

  // Text editor panel
  let editor = document.getElementById('editor-panel');
  let editorHeader = document.getElementsByClassName('editor-header');
  let editorFileTab = document.getElementById('file-tab');
  let editorEditors = document.getElementById('file-editors');
  let editorIndentSelector = document.getElementById('indent-selector-p');
  let editorIndentDropdown = document.getElementById('selected-indent');

  let stashTitle = document.getElementById("stash-list-title");
  let stashes = document.getElementsByClassName("stash-list-item");

  if (color === 'white') {
    for (let i = 0; i < head.length; i++) {
      // Currently unneeded nav class printout.
      // console.log(head[i]);
      head[i].className = 'navbar navbar-white';
    }
    for (let i = 0; i < headButton.length; i++) {
      if (before === 'default') {
        headButton[i].classList.remove('btn-inverse');
      }
      headButton[i].classList.add('btn-default');
    }
    for (let i = 0; i < fa.length; i++) {
      fa[i].setAttribute('style', 'color:#a8abaf');
    }

    fp.setAttribute('style', 'background-color:#E3E3E3');

    for (let i = 0; i < p.length; i++) {
      p[i].style.color = '#fff';
    }
    for (let i = 0; i < h1.length; i++) {
      h1[i].style.color = '#5E5E5E';
    }
    for (let i = 0; i < stashes.length; i++){
      stashes[i].style.color = "#000000";
      stashes[i].style.borderColor = "#000000";
    }

    changeTextColor('#fff');

    diffp.style.color = '#fff';
    diffp.style.backgroundColor = '#302f2f';
    diffPanel.style.backgroundColor = '#302f2f';
    network.style.backgroundColor = '#D6D6D6';
    footer.style.backgroundColor = '#E3E3E3';
    arp.style.backgroundColor = '#D1D1D1';
    auth.style.backgroundColor = '#D6D6D6';
    repoName.style.color = '#000000';
    branchName.style.color = '#000000';
    modifiedTitle.style.color = '#000000';
    stagedTitle.style.color = '#000000';
    diffChangePopUp.style.backgroundColor = '#E3E3E3';
    commitDiffPanel.style.backgroundColor = '#302f2f';
    stashTitle.style.color = '#000000';

    if (modifiedMessageColor != null) {
      modifiedMessageColor.style.color = '#000000';
    }
    if (stagedMessageColor != null) {
      stagedMessageColor.style.color = '#000000';
    }

    before = 'white';
  }
  else if (color === 'pink') {
    for (var i = 0; i < head.length; i++) {
            // Currently unneeded nav class printout.
            // console.log(head[i]);
            head[i].className = 'navbar navbar-pink';
        }
        for (var i = 0; i < headButton.length; i++) {
            if (before === 'default') {
                headButton[i].classList.remove('btn-inverse');
            }
            headButton[i].classList.add('btn-default');
        }
        for (var i = 0; i < fa.length; i++) {
            fa[i].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color: #FFC2C2');
        for (var i = 0; i < p.length; i++) {
            p[i].style.color = '#000000';
        }
        for (var i = 0; i < h1.length; i++) {
            h1[i].style.color = '#FFA3A3';
        }
        for (let i = 0; i < stashes.length; i++){
          stashes[i].style.color = "#000000";
          stashes[i].style.borderColor = "#000000";
        }

        changeTextColor('#000000');

        diffp.style.color = '#000000';
        diffp.style.backgroundColor = 'white';
        diffPanel.style.backgroundColor = 'white';
        network.style.backgroundColor = '#FFE5E5';
        footer.style.backgroundColor = '#FFD7D7';
        footer.style.border = '#FFD7D7';
        arp.style.backgroundColor = '#FFD7D7';
        auth.style.backgroundColor = '#FFE5E5';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#FFD7D7';
        commitDiffPanel.style.backgroundColor = '#fff';
        stashTitle.style.color = '#000000';

        if (modifiedMessageColor != null) {
          modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
          stagedMessageColor.style.color = '#fff';
        }

        before = 'pink';
    }
    else if (color === 'blue') {
      for (var i = 0; i < head.length; i++) {
              // Currently unneeded nav class printout.
              // console.log(head[i]);
              head[i].className = 'navbar navbar-blue';
          }
          for (var i = 0; i < headButton.length; i++) {
              if (before === 'default') {
                  headButton[i].classList.remove('btn-inverse');
              }
              headButton[i].classList.add('btn-default');
          }
          for (var i = 0; i < fa.length; i++) {
              fa[i].setAttribute('style', 'color:white');
          }
          fp.setAttribute('style', 'background-color: #9DD2FE');
          for (var i = 0; i < p.length; i++) {
              p[i].style.color = '#000000';
          }
          for (var i = 0; i < h1.length; i++) {
              h1[i].style.color = '#4EAFFE';
          }
          for (let i = 0; i < stashes.length; i++){
            stashes[i].style.color = "#000000";
            stashes[i].style.borderColor = "#000000";
          }

          changeTextColor('#000000');

          diffp.style.color = '#000000';
          diffp.style.backgroundColor = 'white';
          diffPanel.style.backgroundColor = 'white';
          network.style.backgroundColor = '#EEF6FF';
          footer.style.backgroundColor = '#B6DEFF';
          footer.style.border = '#B6DEFF';
          arp.style.backgroundColor = '#DAEEFF';
          auth.style.backgroundColor = '#DAEEFF';
          repoName.style.color = '#fff';
          branchName.style.color = '#fff';
          modifiedTitle.style.color = '#fff';
          stagedTitle.style.color = '#fff';
          diffChangePopUp.style.backgroundColor = '#B6DEFF';
          commitDiffPanel.style.backgroundColor = '#fff';
          stashTitle.style.color = '#000000';

          if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
          }
          if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
          }

          before = 'blue';
    }
    else if (color === 'navy') {
      for (var i = 0; i < head.length; i++) {
              // Currently unneeded nav class printout.
              // console.log(head[i]);
              head[i].className = 'navbar navbar-navy';
          }
          for (var i = 0; i < headButton.length; i++) {
              if (before === 'default') {
                  headButton[i].classList.remove('btn-inverse');
              }
              headButton[i].classList.add('btn-default');
          }
          for (var i = 0; i < fa.length; i++) {
              fa[i].setAttribute('style', 'color:white');
          }
          fp.setAttribute('style', 'background-color: #0066FF');
          for (var i = 0; i < p.length; i++) {
              p[i].style.color = '#000000';
          }
          for (var i = 0; i < h1.length; i++) {
              h1[i].style.color = '#001C83';
          }
          for (let i = 0; i < stashes.length; i++){
            stashes[i].style.color = "#000000";
            stashes[i].style.borderColor = "#000000";
          }

          changeTextColor('#000000');

          diffp.style.color = '#000000';
          diffp.style.backgroundColor = 'white';
          diffPanel.style.backgroundColor = 'white';
          network.style.backgroundColor = '#CCE0FF';
          network.style.border = '#CCE0FF';
          footer.style.backgroundColor = '#4D94FF';
          footer.style.border = '#4D94FF';
          arp.style.backgroundColor = '#4D94FF';
          auth.style.backgroundColor = '#4D94FF';
          repoName.style.color = '#fff';
          branchName.style.color = '#fff';
          modifiedTitle.style.color = '#fff';
          stagedTitle.style.color = '#fff';
          diffChangePopUp.style.backgroundColor = '#0066FF';
          commitDiffPanel.style.backgroundColor = '#fff';
          stashTitle.style.color = '#000000';

          if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
          }
          if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
          }

          before = 'navy';
    }
    else if (color === 'green') {
      for (var i = 0; i < head.length; i++) {
        // Currently unneeded nav class printout.
              // console.log(head[i]);
              head[i].className = 'navbar navbar-green';
          }
          for (var i = 0; i < headButton.length; i++) {
              if (before === 'default') {
                  headButton[i].classList.remove('btn-inverse');
              }
              headButton[i].classList.add('btn-default');
          }
          for (var i = 0; i < fa.length; i++) {
              fa[i].setAttribute('style', 'color:white');
          }
          fp.setAttribute('style', 'background-color: #5CD65C');
          for (var i = 0; i < p.length; i++) {
              p[i].style.color = '#000000';
          }
          for (var i = 0; i < h1.length; i++) {
              h1[i].style.color = '#00990d';
          }
          for (let i = 0; i < stashes.length; i++){
            stashes[i].style.color = "#000000";
            stashes[i].style.borderColor = "#000000";
          }

          changeTextColor('#000000');

          diffp.style.color = '#000000';
          diffp.style.backgroundColor = 'white';
          diffPanel.style.backgroundColor = 'white';
          network.style.backgroundColor = '#EBFAEB';
          footer.style.backgroundColor = '#ADEBAD';
          footer.style.border = '#ADEBAD';
          arp.style.backgroundColor = '#ADEBAD';
          auth.style.backgroundColor = '#ADEBAD';
          repoName.style.color = '#fff';
          branchName.style.color = '#fff';
          modifiedTitle.style.color = '#fff';
          stagedTitle.style.color = '#fff';
          diffChangePopUp.style.backgroundColor = '#ADEBAD';
          commitDiffPanel.style.backgroundColor = '#fff';
          stashTitle.style.color = '#000000';

          if (modifiedMessageColor != null) {
          modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
          stagedMessageColor.style.color = '#fff';
        }

          before = 'green';
  }
  else if (color === 'default') {
    for (let i = 0; i < head.length; i++) {
      // Currently unneeded nav class printout.
      // console.log(head[i]);
      head[i].className = 'navbar navbar-inverse';
    }
    for (let i = 0; i < headButton.length; i++) {
      if (before === 'default') {
        headButton[i].classList.remove('btn-default');
      }
      headButton[i].classList.add('btn-inverse');
    }
    for (let i = 0; i < fa.length; i++) {
      fa[i].setAttribute('style', 'color:white');
    }

    fp.setAttribute('style', 'background-color:#282828');

    for (let i = 0; i < p.length; i++) {
      p[i].style.color = '#fff';
    }
    for (let i = 0; i < h1.length; i++) {
      h1[i].style.color = '#ccc';
    }
    for (let i = 0; i < stashes.length; i++){
      stashes[i].style.color = "lightgray";
      stashes[i].style.borderColor = "lightgray";
    }

    changeTextColor('#fff');

    diffp.style.color = '#fff';
    diffp.style.backgroundColor = '#282828';
    diffPanel.style.backgroundColor = '#282828';
    network.style.backgroundColor = '#181818';
    footer.style.backgroundColor = '#282828';
    arp.style.backgroundColor = '#282828';
    auth.style.backgroundColor = '#282828';
    repoName.style.color = '#fff';
    branchName.style.color = '#fff';
    modifiedTitle.style.color = '#fff';
    stagedTitle.style.color = '#fff';
    diffChangePopUp.style.backgroundColor = '#282828';
    commitDiffPanel.style.backgroundColor = '#282828';
    stashTitle.style.color = 'lightgray';

    if (modifiedMessageColor != null) {
      modifiedMessageColor.style.color = '#fff';
    }
    if (stagedMessageColor != null) {
      stagedMessageColor.style.color = '#fff';
    }

    before = 'default';
  }

  /* change text color corresponding to the theme. */
  function changeTextColor(textColor){
    for(let i=0; i < diffChangePanelText.length; i++) {
      diffChangePanelText[i].setAttribute('style', 'color:' + textColor);
    }
  }

  // Match the style of the file editor to the rest of the app
  editor!.style.color = diffp.style.color;
  editor!.style.backgroundColor = network.style.backgroundColor;

  // Use the same css settings for the editor header as the navbar
  let navbarStyle = head[0].className.split(" ")[1];
  for (let i = 0; i < editorHeader.length; i++) {
    editorHeader[i].className = 'editor-header ' + navbarStyle;
  }

  editorFileTab!.style.color = repoName.style.color;
  editorFileTab!.style.backgroundColor = fp.style.backgroundColor;
  editorEditors!.style.color = diffp.style.color;
  editorEditors!.style.backgroundColor = diffp.style.backgroundColor;
  editorIndentSelector!.style.color = repoName.style.color;
  editorIndentDropdown!.style.color = diffp.style.color;
  editorIndentDropdown!.style.backgroundColor = diffp.style.backgroundColor;
}
