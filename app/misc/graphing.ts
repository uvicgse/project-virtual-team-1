/* This file initializes all of the values for the nodes in the graphing panel
   of VisualGit. It uses dataset variables from graphSetup.ts.

   Types of nodes in the network.
       Basic = Commit node in the highest zoom level (1st level). Represents a collection of commits
       Abstract = Commit node in the second zoom level . Represents a collection of commits
       Node = Commit node in the lowest zoom level (3rd level). Represents a a single commit
       Branch = Represents a branch reference. Is linked to a single commit node
       Tag = Represents a tag reference. Is linked to a single commit node

    Levels of zoom in the graph:
       Basic: Highest level of zoom (1st level), graph's initial state upon launch
       Abstract/abs: Second highest level of zoom
       Node:  Lowest level of zoom (3rd level)
*/

import * as nodegit from "git";

let nodeId = 1;
let absNodeId = 1;
let basicNodeId = 1;
let abstractList = [];
let basicList = [];
let bDict = {};
let commitHistory = [];
let commitList = [];
let spacingY = 100;
let spacingX = 80;
let tagSpacingY = 100;
let tagSpacingX = 300;
let parentCount = {};
let columns: boolean[] = [];
let edgeDic = {};
let numOfCommits = 0;
let branchIds = {};
let tagIds = {};
let unumberPrev = 0;
let selectedCommit: string;

enum NodeType{Basic, Abstract, Node, Branch, Tag}

// In order to allow tags, branches, and nodes to have unique numerical id's
// reference: https://stackoverflow.com/questions/8012002/create-a-unique-number-with-javascript-time
function generateUniqueNumber() {
    var date = Date.now();

    // Create a new unique id number if created at same millisecond as previous
    if (date <= unumberPrev) {
        date = ++unumberPrev;
    } else {
        unumberPrev = date;
    }

    return date;
}

// Process and populate the initial graph
function processGraph(commits: nodegit.Commit[]) {
    var promise = new Promise(function(resolve,reject){
        commitHistory = [];
        abstractList = [];
        numOfCommits = commits.length;

        sortCommits(commits)
            .then(makeBranchColor)
            .then(populateCommits)
            .then(function(data) {
                let textBox = document.getElementById("modal-text-box");
                if (textBox != null) {
                    document.getElementById('spinner').style.display = 'none';
                } else {
                    console.log("Modal-text-box is missing");
                }
            });
    });
    return promise;
}

// Sort the commit nodes in order to better populate the graph
function sortCommits(commits) {
    var promise = new Promise((resolve, reject) => {

        var chunk = 100;

        function computeChunk() {
            var count = chunk;

            while (commits.length > 0 && count--) {
                let commit = commits.shift();
                let parents = commit.parents();
                if (parents === null || parents.length === 0) {
                    commitHistory.push(commit);
                } else {
                    let count = 0;
                    for (let i = 0; i < parents.length; i++) {
                        let psha = parents[i].toString();
                        for (let j = 0; j < commitHistory.length; j++) {
                            if (commitHistory[j].toString() === psha) {
                                count++;
                                break;
                            }
                        }
                        if (count < i + 1) {
                            break;
                        }
                    }
                    if (count === parents.length) {
                        commitHistory.push(commit);
                    } else {
                        commits.push(commit);
                    }
                }
            }

            if (commits.length > 0){
                setTimeout(computeChunk, 1);
            } else {
                resolve();
            }
        }
        computeChunk();
    })
    return promise;
}

// Populate the graph nodes and add edges where appropriate
function populateCommits(oldResult) {
    var promise = new Promise((resolve, reject) => {
        // reset variables for idempotency, shouldn't be needed when a class is created instead
        nodeId = 1;
        absNodeId = 1;
        basicNodeId = 1;
        commitList = [];
        parentCount = {};
        columns = [];

        // Plot the graph
        for (let i = 0; i < commitHistory.length; i++) {
            let parents: string[] = commitHistory[i].parents();
            let nodeColumn;
            for (let j = 0; j < parents.length; j++) {
                let parent = parents[j];
                if (!(parent in parentCount)) {
                    parentCount[parent] = 1;
                } else {
                    parentCount[parent]++;
                }
            }
            if (parents.length === 0) {
                // no parents means first commit so assign the first column
                columns[0] = true;
                nodeColumn = 0;
            } else if (parents.length === 1) {
                let parent = parents[0];
                let parentId = getNodeId(parent.toString());
                let parentColumn = commitList[parentId - 1]["column"];
                if (parentCount[parent] === 1) {
                    // first child
                    nodeColumn = parentColumn;
                } else {
                    nodeColumn = nextFreeColumn(parentColumn);
                }
            } else {
                let desiredColumn: number = -1;
                let desiredParent: string = "";
                let freeableColumns: number[] = [];
                for (let j = 0; j < parents.length; j++) {
                    let parent: string = parents[j];
                    let parentId = getNodeId(parent.toString());
                    let proposedColumn = commitList[parentId - 1]["column"];

                    if (desiredColumn === -1 || desiredColumn > proposedColumn) {
                        desiredColumn = proposedColumn;
                        desiredParent = parent;
                    } else {
                        freeableColumns.push(proposedColumn);
                    }

                }
                for (let k = 0; k < freeableColumns.length; k++) {
                    let index = freeableColumns[k];
                    columns[index] = false;
                }
                if (parentCount[desiredParent] === 1) {
                    // first child
                    nodeColumn = desiredColumn;
                } else {
                    nodeColumn = nextFreeColumn(desiredColumn);
                }
            }

            // Create the three levels nodes for zoom in the graph
            makeNode(commitHistory[i], nodeColumn);
            makeAbsNode(commitHistory[i], nodeColumn);
            makeBasicNode(commitHistory[i], nodeColumn);
        }

        // Add edges
        for (let i = 0; i < commitHistory.length; i++) {
            addEdges(commitHistory[i]);
        }

        for (let i = 0; i < abstractList.length; i++) {
            addAbsEdge(abstractList[i]);
        }

        for (let i = 0; i < basicList.length; i++) {
            addBasicEdge(basicList[i]);
        }

        // Ensure the graph stays in a proper timeline, and recenter
        sortBasicGraph();

        commitList = commitList.sort(timeCompare);
        reCenter();
        resolve(oldResult);
    });
    return promise;
}

// Helper function to sort the graph
function timeCompare(a, b) {
    return a.time - b.time;
}

// Helper function to populate nodes in the right order
function nextFreeColumn(column: number) {
    while (columns[column]) {
        column++;
    }
    return column;
}

// Add edges to the lowest level of the graph
function addEdges(c) {
    let parents = c.parents();
    if (parents.length !== 0) {
        parents.forEach(function(parent) {
            let sha: string = c.sha();
            let parentSha: string = parent.toString();
            makeEdge(sha, parentSha);
        });
    }
}

// Add edges to the middle level of the graph
function addAbsEdge(c) {
    let parents = c['parents'];
    for (let i = 0; i < parents.length; i++) {
        for (let j = 0; j < abstractList.length; j++) {
            if (abstractList[j]['sha'].indexOf(parents[i].toString()) > -1) {
                abEdges.add({
                    from: abstractList[j]['id'],
                    to: c['id']
                });
            }
        }
    }
}

// Add edges to the highest level of the graph
function addBasicEdge(c) {
    let flag = true;
    let parents = c['parents'];
    edgeDic[c['id']] = [];
    for (let i = 0; i < parents.length; i++) {
        for (let j = 0; j < basicList.length; j++) {
            if (basicList[j]['sha'].indexOf(parents[i].toString()) > -1 && basicList[j] !== c) {
                flag = false;
                bsEdges.add({
                    from: basicList[j]['id'],
                    to: c['id']
                });
                edgeDic[c['id']].push(basicList[j]['id']);
            }
        }
    }
}

// Sorts the graph accordingly for display
function sortBasicGraph() {
    let tmp = basicList;
    let idList = [];
    while (tmp.length > 0) {

        let n = tmp.shift();
        let ta = edgeDic[n.id];
        let count = 0;
        for (let i = 0; i < ta.length; i++) {
            for (let j = 0; j < idList.length; j++) {
                if (idList[j].toString() === ta[i].toString()) {
                    count++;
                }
            }
            if (count < i + 1) {
                break;
            }
        }
        if (count === ta.length) {
            idList.push(n.id);
        } else {
            tmp.push(n);
        }
    }
    for (let i = 0; i < idList.length; i++) {
        // Update the nodes in the data set to have a record of their inital spacing and id's
        bsNodes.update({id: idList[i], y: i * spacingY});
        // Update the nodes in the data set to have a record of branch's inital spacing and id's
        if (idList[i] in branchIds) {
            bsNodes.update({id: branchIds[idList[i]], y: (i + 0.7) * spacingY})
        }
        // Update the nodes in the data set to have a record of tag's inital spacing and id's
        if (idList[i] in tagIds) {
            bsNodes.update({id: tagIds[idList[i]], y: (i + 0.7) * spacingY, x: (i + 0.7) * spacingX})
        }
    }
}

// Creates the branches to associate with commit nodes
function makeBranchColor(oldResult) {
    var promise = new Promise((resolve, reject) => {
        let bcList = [];

        for (let i = 0; i < commitHistory.length; i++) {
            if (commitHistory[i].toString() in bname) {
                bcList.push({
                    oid: commitHistory[i],
                    cid: i
                });
            }
        }

        var chunk = 10;

        function computeChunk() {
            var count = chunk;
            while (bcList.length > 0 && count--) {
                let commit = bcList.pop();
                let oid = commit.oid.toString();
                let cid = commit.cid;
                if (oid in bDict) {
                    bDict[oid].push(cid);
                } else {
                    bDict[oid] = [cid];
                }

                let parents = commit.oid.parents();

                for (let i = 0; i < parents.length; i++) {
                    for (let j = 0; j < commitHistory.length; j++) {
                        if (commitHistory[j].toString() === parents[i].toString()) {
                            bcList.push({
                                oid: commitHistory[j],
                                cid: cid
                            });
                        }
                    }
                }
            }
            if(bcList.length > 0){
                setTimeout(computeChunk, 1);
            } else {
				resolve(oldResult);
			}

        }
        computeChunk();
    });
    return promise;
}

// Create highest level of the graph's zoom. This is the first graph displayed upon launch.
function makeBasicNode(c, column: number) {
    let reference;
    let name = getName(c.author().toString());
    let stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    let flag = true;
    let count = 1;
    let id;
    let tagid;
    let colors1 = JSON.stringify(bDict[c.toString()]);
    for (let i = 0; i < basicList.length; i++) {
        let colors2 = JSON.stringify(basicList[i]['colors']);
        if (colors1 === colors2) {
            flag = false;
            id = basicList[i]['id'];
            tagid = basicList[i]['id'] + 1;
            basicList[i]['count'] += 1;
            count = basicList[i]['count'];
            bsNodes.update({id: i+1, title: "Number of Commits: " + count});
            basicList[i]['sha'].push(c.toString());
            basicList[i]['parents'] = basicList[i]['parents'].concat(c.parents());
            break;
        }
    }

    if (flag) {
        id = basicNodeId++;
        tagid = id + 1;

        let title = "Number of Commits: " + count;
        console.log(title);
        // Add commit nodes to graph
        bsNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author(),
            nodeType: NodeType.Basic
        });
        // Update node list
        let shaList = [];
        shaList.push(c.toString());

        basicList.push({
            sha: shaList,
            id: id,
            time: c.timeMs(),
            column: column,
            colors: bDict[c.toString()],
            reference: reference,
            parents: c.parents(),
            count: 1,
        });
    }

    // Add branches to commits, if any exist
    if (c.toString() in bname) {
        for (let i = 0; i < bname[c.toString()].length; i++) {
            let branchName = bname[c.toString()][i];
            let bp = branchName.name().split("/");
            let shortName = bp[bp.length - 1]; // Get the branch's name instead of ref/origin/branch
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            let bsnodeId = generateUniqueNumber();
            // Add branch nodes
            bsNodes.add({
                id: bsnodeId,
                // shape: "box", // old shape
                // Create and display fork icon
                shape: "icon",
                icon: {
                  face: "FontAwesome",
                  code: "\uf126",
                  color: "white"
                },
                // Make text visible beneath icon
                font: {
                  color: "white",
                },
                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
                nodeType: NodeType.Branch
            });
            // Add an edge from the bracnh to the commit
            bsEdges.add({
                from: bsnodeId,
                to: id
            });
            // Update the branch list
            branchIds[id] = bsnodeId;
        }
    }

    // Initializing viewable tags, if any exist
    if (c.toString() in tags) {
        for (let i = 0; i < tags[c.toString()].length; i++) {
            let tagName = tags[c.toString()][i];
            let tp = tagName.name().split("/");
            let shortTagName = tp[tp.length - 1]; // Get the tag's name instead of ref/origin/tag
            console.log(shortTagName + " tag: " + tagName.isHead().toString());
            if (tagName.isHead()) {
                shortTagName = "*" + shortTagName;
            }
            let bsnodeId = generateUniqueNumber();
            // Add tag nodes
            bsNodes.add({
                id: bsnodeId,
                // shape: "ellipse", // old shape
                // Create and display tag icon
                shape: "icon",
                icon: {
                  face: "FontAwesome",
                  code: "\uf02b",
                  color: "teal"
                },
                // Make text visible beneath icon
                font: {
                  color: "white",
                },
                title: tagName, // hover text
                label: shortTagName, // shown under/in shape
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * tagSpacingX,
                y: (id - 0.3) * tagSpacingY,
            });
            // Create edges between tags and commits using dashed lines for differenciation
            bsEdges.add({
                from: bsnodeId,
                to: id,
                dashes: true,
                arrows: {
                    to: false,
                    middle: false,
                    from: false,
                },
            });
            // Update tag list
            tagIds[tagid] = bsnodeId;
        }
    }
}

// Create second level of the graph's zoom.
function makeAbsNode(c, column: number) {
    let reference;
    let name = getName(c.author().toString());
    let stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    let email = stringer.split("%")[1];
    let flag = true;
    let count = 1;
    if (c.parents().length === 1) {
        let cp = c.parents()[0].toString();
        for (let i = 0; i < abstractList.length; i++) {
            let index = abstractList[i]['sha'].indexOf(cp);
            if (index > -1 && abstractList[i]['email'] === email && abstractList[i]['column'] === column && !(c.toString() in bname)) {
                flag = false;
                abstractList[i]['count'] += 1;
                count = abstractList[i]['count'];
                abstractList[i]['sha'].push(c.toString());
                abNodes.update({id: i+1, title: "Author: " + name + "<br>" + "Number of Commits: " + count});
                break;
            }
        }
    }

    if (flag) {
        let id = absNodeId++;
        let tagid = id + 1;
        let title = "Author: " + name + "<br>" + "Number of Commits: " + count;
        // Add commit nodes
        abNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author(),
            nodeType: NodeType.Abstract
        });

        // Add branches to commits, if any exist
        if (c.toString() in bname) {
            for (let i = 0; i < bname[c.toString()].length; i++) {
                let branchName = bname[c.toString()][i];
                let bp = branchName.name().split("/");
                let shortName = bp[bp.length - 1]; // Get the branch's name instead of ref/origin/branch
                console.log(shortName + " sub-branch: " + branchName.isHead().toString());
                if (branchName.isHead()) {
                    shortName = "*" + shortName;
                }
                let bsnodeId = generateUniqueNumber();
                // Add branch nodes
                abNodes.add({
                    id: bsnodeId,
                    // shape: "box", // old shape
                    // Create and display fork icon
                    shape: "icon",
                    icon: {
                      face: "FontAwesome",
                      code: "\uf126",
                      color: "white"
                    },
                    // Make text visible beneath icon
                    font: {
                      color: "white",
                    },
                    title: branchName,
                    label: shortName,
                    physics: false,
                    fixed: false,
                    x: (column - 0.6 * (i + 1)) * spacingX,
                    y: (id - 0.3) * spacingY,
                    nodeType: NodeType.Branch
                });
                // Add an edge from the branch to the commit
                abEdges.add({
                    from: bsnodeId,
                    to: id
                });
            }
        }

        // Initializing viewable tags, if any exist
        if (c.toString() in tags) {
            for (let i = 0; i < tags[c.toString()].length; i++) {
                let tagName = tags[c.toString()][i];
                let tp = tagName.name().split("/");
                let shortTagName = tp[tp.length - 1]; // Get the tag's name instead of ref/origin/tag
                console.log(shortTagName + " tag: " + tagName.isHead().toString());
                if (tagName.isHead()) {
                    shortTagName = "*" + shortTagName;
                }
                let bsnodeId = generateUniqueNumber();
                abNodes.add({
                    id: bsnodeId,
                    // shape: "ellipse", // old shape
                    // Create and display tag icon
                    shape: "icon",
                    icon: {
                      face: "FontAwesome",
                      code: "\uf02b",
                      color: "teal"
                    },
                    // Make text visible beneath icon
                    font: {
                      color: "white",
                    },
                    title: tagName, // hover text
                    label: shortTagName, // shown under/in shape
                    physics: false,
                    fixed: false,
                    x: (column - 0.6 * (i + 1)) * tagSpacingX,
                    y: (id - 0.3) * tagSpacingY,
                });
                // Create edges between tags and commits using dashed lines for differenciation
                abEdges.add({
                    from: bsnodeId,
                    to: id,
                    dashes: true,
                    arrows: {
                        to: false,
                        middle: false,
                        from: false,
                    },
                });
            }
        }
        // Update node list
        let shaList = [];
        shaList.push(c.toString());

        abstractList.push({
            sha: shaList,
            id: id,
            time: c.timeMs(),
            column: column,
            email: email,
            reference: reference,
            parents: c.parents(),
            count: 1,
        });
    }
}

// Create lowest level of the graph's zoom.
function makeNode(c, column: number) {
    let id = nodeId++;
    let tagid = id + 1;
    let reference;
    let name = getName(c.author().toString());
    let stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    let email = stringer.split("%")[1];
    let title = "Author: " + name + "<br>" + "Message: " + c.message() + "<br>";

    // If the commit has tags, they will show with the hover text on the commit node.
    if (c.toString() in tags) {
      for (let i = 0; i < tags[c.toString()].length; i++) {
        let hoverTag = tags[c.toString()][i];
        let hoverTagSplit = hoverTag.name().split("/");
        let hoverTagName = hoverTagSplit[hoverTagSplit.length - 1];
        let tagHover = "Tags: " + hoverTagName + "<br>";
        title = title + tagHover;
      }
    }

    let flag = false;
    // Add commit nodes to the graph
    nodes.add({
        id: id,
        shape: "circularImage",
        title: title,
        image: img4User(name),
        physics: false,
        fixed: false,
        x: (column - 1) * spacingX,
        y: (id - 1) * spacingY,
        author: c.author(),
        nodeType: NodeType.Node,
        commitSha: c.sha()
    });

    // Add branches to commits, if any exist
    if (c.toString() in bname) {
        for (let i = 0; i < bname[c.toString()].length; i++) {
            let branchName = bname[c.toString()][i];
            let bp = branchName.name().split("/");
            let shortName = bp[bp.length - 1]; // Get the branch's name instead of ref/origin/branch
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            let bsnodeId = generateUniqueNumber();
            // Add branch nodes
            nodes.add({
                id: bsnodeId,
                // shape: "box", // old shape
                // Create and display fork icon
                shape: "icon",
                icon: {
                  face: "FontAwesome",
                  code: "\uf126",
                  color: "white"
                },
                // Make text visible beneath icon
                font: {
                  color: "white",
                },                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
                nodeType: NodeType.Branch
            });
            // Add an edge from the bracnh to the commit
            edges.add({
                from: bsnodeId,
                to: id
            });
        }
        flag = true;
    }

    // Initializing viewable tags, if any exist
    if (c.toString() in tags) {
        for (let i = 0; i < tags[c.toString()].length; i++) {
            let tagName = tags[c.toString()][i];
            let tp = tagName.name().split("/");
            let shortTagName = tp[tp.length - 1]; // Get the tag's name instead of ref/origin/tag
            console.log(shortTagName + " tag: " + tagName.isHead().toString());
            if (tagName.isHead()) {
                shortTagName = "*" + shortTagName;
            }
            let bsnodeId = generateUniqueNumber();
            nodes.add({
                id: bsnodeId,
                // shape: "ellipse", // old shape
                // Create and display tag icon
                shape: "icon",
                icon: {
                  face: "FontAwesome",
                  code: "\uf02b",
                  color: "teal"
                },
                // Make text visible beneath icon
                font: {
                  color: "white",
                },
                title: tagName, // hover text
                label: shortTagName, // shown under/in shape
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * tagSpacingX,
                y: (id - 0.3) * tagSpacingY,
            });
            // Create edges between tags and commits using dashed lines for differenciation
            edges.add({
                from: bsnodeId,
                to: id,
                dashes: true,
                arrows: {
                    to: false,
                    middle: false,
                    from: false,
                },
            });
        }
        flag = true;
    }
    // Update node list
    commitList.push({
        sha: c.sha(),
        id: id,
        time: c.timeMs(),
        column: column,
        email: email,
        reference: reference,
        branch: flag,
    });
    console.log("commit: "+ id + ", message: " + commitList[id-1]['id']);
}

// Add to edge list dataset in graphSetup.ts
function makeEdge(sha: string, parentSha: string) {
    let fromNode = getNodeId(parentSha.toString());
    let toNode = getNodeId(sha);

    edges.add({
        from: fromNode,
        to: toNode
    });
}

// Find the identifying number of a node
function getNodeId(sha: string) {
    for (let i = 0; i < commitList.length; i++) {
        let c = commitList[i];
        if (c["sha"] === sha) {
            return c["id"];
        }
    }
}

// Recenter the graph
function reCenter() {
    let moveOptions = {
        offset: {x: -150, y: 200},
        scale: 1,
        animation: {
            duration: 1000,
            easingFunction: "easeInOutQuad",
        }
    };

    network.focus(commitList[commitList.length - 1]["id"], moveOptions);
}

// Open a specific commit's dialog box
function getSelectedCommit() {
    return selectedCommit;
}
