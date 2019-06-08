# VisualGit - SOFTENG 701 Group 3

VisualGit is a visually-oriented desktop client for Git aimed at helping students learn the standard Git workflow.

# Installation

### Prerequisites

`Node.js` and its package manager - `npm` (Node Package Manager) are used to manage VisualGit's dependencies. To run 
this project, `node` and `npm` are required. To setup `node` to have the correct version, see the 
[Project Setup](https://github.com/uvicgse/project-virtual-team-1/wiki/Project-Setup).

**_Note:_** _If you used `Homebrew` to install `node` on macOS, you may need to reinstall `node` by uninstalling the `brew` 
version first. See the [Project Setup](https://github.com/uvicgse/project-virtual-team-1/wiki/Project-Setup) to do so._

### Repository Setup
The repository can be cloned using either HTTPS or SSH, but SSH will be needed for making pull requests.

#### SSH
````
git clone git@github.com:uvicgse/project-seed.git
````

#### HTTPS
````
git clone https://github.com/uvicgse/project-seed.git
````
then...

````
cd VisualGit_SE701_2019_3
npm install
````
then... for Windows 
````
npm start
````

or... for macOS
````
npm run macstart
````

### ssh-agent
As VisualGit utilises SSH for user authentication, ensure you 
[generate an SSH key for your GitHub account](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/). 
If you are not running Mac, you will also need to set up and run an ssh-agent to access your SSH key at run time 
without providing your credentials each time.

If you still need help setting up SSH, follow the [GitHub guide to SSH.](https://help.github.com/en/articles/connecting-to-github-with-ssh)
# Development

### Angular
[Angular](https://angular.io/) is a popular open-sourced web framework based on TypeScript. Angular is a complete 
re-write from AngularJS (a.k.a Angular v1). This project runs a beta-version of Angular 2, so there are a few 
compatibility issues with newer versions of `npm` and project structure of newer versions of Angular. 

### TypeScript
[TypeScript](https://www.typescriptlang.org/) is a statically-typed superset of JavaScript that compiles into JavaScript. 
Our source files are written in TypeScript (.ts files), and then compiled into JavaScript (.js files). You will need to 
run the TypeScript compiler to compile the source code. e.g. [typescript-compiler](https://www.npmjs.com/package/typescript-compiler) 
for Node.

### CSS
Style definitions for this project are done using [CSS](https://www.w3.org/Style/CSS/Overview.en.html).

# Features

### Opening / Cloning repositories
Repositories can be added by two methods; either by cloning the remotely hosted repository or opening it from the local 
file system. This is achieved using the add repository button in the top left which will update the screen to the add 
repository view.

#### Clone
Cloning with SSH is recommended as there is not yet any method for entering user credentials in VisualGit. This means 
that if you clone using HTTPS, you will still be able to see local changes and commit locally but not push.

#### Open local repository
Currently, when you clone a repository, it is saved to a directory under `./VisualGit/`. This means that when you open a
 repository which is saved locally, you can simply enter the name of the directory relative to the VisualGit directory. 
 Other save locations are not currently supported but it is planned in future work.

### Adding & Committing
When changes are made in a repository which is open, the interface will update by showing each file which has uncommitted 
changes. These changes will be displayed as a traffic light scheme:
 - Green: Added file
 - Orange: Modified file
 - Red: Deleted file

This is used to allow users to see the different types of changes easily and once they click on the files, the file 
differences will be shown. The file differences are shown line by line with green lines representing added lines and 
red representing deleted lines. Any other parts of the file are unchanged.

### Pushing & Pulling from remote
The pulling and pushing currently works for changes which are made on master and origin/master by syncing these up. 
When the pull button is clicked, any changes on the remote repository will be added to the local repository and the 
graph will be updated. When pushing, the same process applies. The changes on master will be pushed to the remote 
repository.


# Help
VisualGit utilises a range of libraries and frameworks, more information on them can be found below:

 - [Electron](http://electron.atom.io/)
 - [Node.js](https://nodejs.org/en/about/)
 - [Angular](https://angular.io/)
 - [nodegit](http://www.nodegit.org/)
 - [simple-git](https://www.npmjs.com/package/simple-git)
 - [Vis.js](http://visjs.org/docs/network/)
 - [TypeScript](https://www.typescriptlang.org/)
