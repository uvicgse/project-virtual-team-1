let pageTitles = {}
let path = require('path');
let wikiPath = "";
let wikiContent: wikiPage[] = [];
let openDisabled = true;

interface wikiPage {
    pageName: string;
    pageContent: string;
}

function openWiki() {
    if (openDisabled){
        return;
    }

    let wikis = document.getElementById("wiki-panel")!;
    wikis.style.width = "100vw";
    wikis.style.height = "100vh";
    wikis.style.zIndex = "15";

    console.log("Full repo path: " + repoFullPath);
    if (!fs.existsSync(repoFullPath + "\\wiki")) {
        cloneWiki();
    } else {
        findPageNames(repoFullPath + "\\wiki",displayWiki)
    }

    let externalLinkButton = document.getElementById("wikiLinkButton")!;
    console.log("Getting wiki url: ");
    console.log(getWikiUrl()!);
    externalLinkButton.setAttribute("href", getWikiUrl()! + "/wiki");
}

function cloneWiki() {
    options = {
        fetchOpts: {
            callbacks: {
                certificateCheck: function () {
                    return 1;
                },
                credentials: function () {
                    return cred;
                }
            }
        }
    };

    let cloneUrl = getWikiUrl() + ".wiki.git";

    let wikiPath = repoFullPath + "\\wiki";
    console.log("The wiki path is: ", wikiPath);
    let repository = Git.Clone.clone(cloneUrl, wikiPath, options)
        .then(function (repository) {
            console.log("Wiki successfully cloned.")

            findPageNames(wikiPath, displayWiki)

        }, function (err) {
            updateModalText("Clone Failed. Wiki does not exist for this repository or you do not have permission to access the wiki. ");
            console.log("ERROR in repo.ts: failed to clone repo: " + err); // TODO show error on screen
            switchToAddRepositoryPanel();
        }
        );

}

//Extract list of all files (pages) in the wiki
function findPageNames(wikiPath: string, callback: () => void) {

    var EXTENSION = '.md';
    wikiContent = [];
    fs.readdir(wikiPath, function (err, files) {
        console.log("The items are: ", files);

        var files = files.filter(function (file) {
            return path.extname(file).toLowerCase() === EXTENSION;
        });

        files.forEach(file => {
            var page :wikiPage = {
                pageName: file.replace(/-/g, ' ').replace('.md', ''),
                pageContent: readFileContents(wikiPath + "\\" + file)
            }
            wikiContent.push(page);
        });
        callback();

    });

}

function readFileContents(wikiDirectory: string) {
    let markdownFile = readFile.read(wikiDirectory, null);
    return markdownFile;
}

function displayWiki() : void {
    let marked = require('marked');
    let wiki_page_counter = 0;

    let wiki_content = document.getElementById("wiki-content")!;
    while (wiki_content.firstChild){
        wiki_content.removeChild(wiki_content.firstChild);
    }

    console.log("The entire content is: ",wikiContent);
    wikiContent.forEach(page => {
        //console.log("Page names: ", page.pageName);
        let wiki_title_template =   document.createElement("div");
        wiki_title_template.className = "panel panel-default";

        let panel_heading = document.createElement("div");
        panel_heading.className = "panel-heading";
        panel_heading.setAttribute("data-toggle","collapse");
        panel_heading.setAttribute("href","#" + "wiki-" + wiki_page_counter);
        panel_heading.innerHTML = page.pageName;

        let panel_body = document.createElement("div");
        panel_body.className = "panel-body collapse";
        panel_body.id = "wiki-" + wiki_page_counter;
        panel_body.innerHTML = marked(page.pageContent);

        wiki_title_template.appendChild(panel_heading);
        wiki_title_template.appendChild(panel_body);
        wiki_content.appendChild(wiki_title_template);

        wiki_page_counter++;
        /*let wiki_content_template =   document.createElement("div");
        wiki_content_template.className = "panel panel-default";
        let content_body = document.createElement("div");
        content_body.className = "content-body";
        content_body.innerHTML = marked(page.pageContent);

        wiki_content_template.appendChild(content_body);
        wiki_titles.appendChild(wiki_content_template);*/
    });
}

function updateWiki() {
    let localWikiPath = repoFullPath + "\\wiki";
    let repository;
    let theirCommit;
    Git.Repository.open(localWikiPath)
        .then(function (repo) {
            repository = repo;
            console.log("Pulling new changes from the remote repository.");
            addCommand("git pull");
            displayModal("Pulling new changes from the remote repository.");

            return repository.fetchAll({
                callbacks: {
                    credentials: function () {
                        return getCredentials();
                    },
                    certificateCheck: function () {
                        return 1;
                    }
                }
            });
        })
        // Now that we're finished fetching, go ahead and merge our local branch
        // with the new one
        .then(function() {
          return Git.Reference.nameToId(repository, "refs/remotes/origin/master");
        })
        .then(function(oid) {
          console.log("Looking up commit with id " + oid + " in all wiki repositories.");
          return Git.AnnotatedCommit.lookup(repository, oid);
        }, function(err) {
          console.log("ERROR looking up commit id(s) in wiki repositories: " + err);
        })
        .then(function(annotated) {
          console.log("Merging " + annotated + " with local forcefully.");
          Git.Merge.merge(repository, annotated, null, {
            checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
          });
          theirCommit = annotated;
        })

}

function getWikiUrl(){

    if (readFile.exists(repoFullPath + "/.git/config")) {
        let gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
        let searchString = "[remote \"origin\"]";

        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length)
        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf("url = "), gitConfigFileText.lastIndexOf("."))
        gitConfigFileText = gitConfigFileText.replace(/ /g,"")
                            .replace("url","")
                            .replace("=","");

        if(gitConfigFileText.includes(".g")){
            gitConfigFileText = gitConfigFileText.replace(".g","");
        }

        let gitConfigFileSubstrings = gitConfigFileText.split('/');


        //If the remote branch was set up using ssh, separate the elements between colons"
        if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
          gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
        }

        let owner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2]
        let nameOfRepository = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1]

        var wikiUrl = "https://github.com/" + owner + "/" + nameOfRepository;

        return wikiUrl;

    }
}
