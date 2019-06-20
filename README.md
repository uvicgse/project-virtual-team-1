# VisualGit - Blue Heron Virtual Team 1 
## Learning without Borders: A hands-on experience in Global Software Development 
_University of Victoria SENG421, CSC485D, CSC586D - Summer 2019_

VisualGit is a visually-oriented desktop client for Git aimed at helping students learn the standard Git workflow. VisualGit was developed at the University of Auckland 

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
git clone git@github.com:uvicgse/project-virtual-team-1.git
````

#### HTTPS
````
git clone https://github.com/uvicgse/project-virtual-team-1.git
````
then...

````
cd project-virtual-team-1
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

# Help
VisualGit utilises a range of libraries and frameworks, more information on them can be found below:

 - [Electron](http://electron.atom.io/)
 - [Node.js](https://nodejs.org/en/about/)
 - [Angular](https://angular.io/)
 - [nodegit](http://www.nodegit.org/)
 - [simple-git](https://www.npmjs.com/package/simple-git)
 - [Vis.js](http://visjs.org/docs/network/)
 - [TypeScript](https://www.typescriptlang.org/)

# Issue Reporting
When creating new issues, or feature requests please follow this handy [formatting guide](https://github.com/uvicgse/project-virtual-team-1/wiki/Issue-Formatting-Guidelines) to aid future developers' understanding of your desires.
