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

// In order to allow tags, branches, and nodes to have unique numerical id's
// reference: https://stackoverflow.com/questions/8012002/create-a-unique-number-with-javascript-time
function generateUniqueNumber() {
    var date = Date.now();

    // If created at same millisecond as previous
    if (date <= unumberPrev) {
        date = ++unumberPrev;
    } else {
        unumberPrev = date;
    }

    return date;
}


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
        sortBasicGraph();

        commitList = commitList.sort(timeCompare);
        reCenter();
        resolve(oldResult);
    });
    return promise;
}

function timeCompare(a, b) {
    return a.time - b.time;
}

function nextFreeColumn(column: number) {
    while (columns[column]) {
        column++;
    }
    return column;
}

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
        bsNodes.update({id: idList[i], y: i * spacingY});
        if (idList[i] in branchIds) {
            bsNodes.update({id: branchIds[idList[i]], y: (i + 0.7) * spacingY})
        }
        if (idList[i] in tagIds) {
            bsNodes.update({id: tagIds[idList[i]], y: (i + 0.7) * spacingY, x: (i + 0.7) * spacingX})
        }
    }
}

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
        bsNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author()
        });

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

    if (c.toString() in bname) {
        for (let i = 0; i < bname[c.toString()].length; i++) {
            let branchName = bname[c.toString()][i];
            let bp = branchName.name().split("/");
            let shortName = bp[bp.length - 1];
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            let bsnodeId = generateUniqueNumber();
            bsNodes.add({
                id: bsnodeId,
                shape: "box",
                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
            });

            bsEdges.add({
                from: bsnodeId,
                to: id
            });

            branchIds[id] = bsnodeId;
        }
    }

    // Initializing viewable tags in highest zoom graph level
    if (c.toString() in tags) {
        for (let i = 0; i < tags[c.toString()].length; i++) {
            let tagName = tags[c.toString()][i];
            let tp = tagName.name().split("/");
            let shortTagName = tp[tp.length - 1];
            console.log(shortTagName + " tag: " + tagName.isHead().toString());
            if (tagName.isHead()) {
                shortTagName = "*" + shortTagName;
            }
            let bsnodeId = generateUniqueNumber();
            bsNodes.add({
                id: bsnodeId,
                shape: "ellipse",
                // color: "teal",
                title: tagName, // hover text
                label: shortTagName, // shown under/in shape
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * tagSpacingX,
                y: (id - 0.3) * tagSpacingY,
            });

            bsEdges.add({
                from: bsnodeId,
                to: id
            });

            tagIds[tagid] = bsnodeId;
        }
    }
}

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

        abNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author()
        });

        if (c.toString() in bname) {
            for (let i = 0; i < bname[c.toString()].length; i++) {
                let branchName = bname[c.toString()][i];
                let bp = branchName.name().split("/");
                let shortName = bp[bp.length - 1];
                console.log(shortName + " sub-branch: " + branchName.isHead().toString());
                if (branchName.isHead()) {
                    shortName = "*" + shortName;
                }
                let bsnodeId = generateUniqueNumber();
                abNodes.add({
                    id: bsnodeId,
                    shape: "box",
                    title: branchName,
                    label: shortName,
                    physics: false,
                    fixed: false,
                    x: (column - 0.6 * (i + 1)) * spacingX,
                    y: (id - 0.3) * spacingY,
                });

                abEdges.add({
                    from: bsnodeId,
                    to: id
                });
            }
        }

        // Initializing viewable tags in second zoom graph level
        if (c.toString() in tags) {
            for (let i = 0; i < tags[c.toString()].length; i++) {
                let tagName = tags[c.toString()][i];
                let tp = tagName.name().split("/");
                let shortTagName = tp[tp.length - 1];
                console.log(shortTagName + " tag: " + tagName.isHead().toString());
                if (tagName.isHead()) {
                    shortTagName = "*" + shortTagName;
                }
                let bsnodeId = generateUniqueNumber();
                abNodes.add({
                    id: bsnodeId,
                    shape: "ellipse",
                    // color: "teal",
                    title: tagName, // hover text
                    label: shortTagName, // shown under/in shape
                    physics: false,
                    fixed: false,
                    x: (column - 0.6 * (i + 1)) * tagSpacingX,
                    y: (id - 0.3) * tagSpacingY,
                });

                abEdges.add({
                    from: bsnodeId,
                    to: id
                });
            }
        }

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
    nodes.add({
        id: id,
        shape: "circularImage",
        title: title,
        image: img4User(name),
        physics: false,
        fixed: false,
        x: (column - 1) * spacingX,
        y: (id - 1) * spacingY,
        author: c.author()
    });

    if (c.toString() in bname) {
        for (let i = 0; i < bname[c.toString()].length; i++) {
            let branchName = bname[c.toString()][i];
            let bp = branchName.name().split("/");
            let shortName = bp[bp.length - 1];
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            let bsnodeId = generateUniqueNumber();
            nodes.add({
                id: bsnodeId,
                shape: "box",
                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
            });

            edges.add({
                from: bsnodeId,
                to: id
            });
        }
        flag = true;
    }

    // Initializing viewable tags in lowest graph level
    if (c.toString() in tags) {
        for (let i = 0; i < tags[c.toString()].length; i++) {
            let tagName = tags[c.toString()][i];
            let tp = tagName.name().split("/");
            let shortTagName = tp[tp.length - 1];
            console.log(shortTagName + " tag: " + tagName.isHead().toString());
            if (tagName.isHead()) {
                shortTagName = "*" + shortTagName;
            }
            let bsnodeId = generateUniqueNumber();
            nodes.add({
                id: bsnodeId,
                shape: "ellipse",
                // color: "teal",
                title: tagName, // hover text
                label: shortTagName, // shown under/in shape
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * tagSpacingX,
                y: (id - 0.3) * tagSpacingY,
            });

            edges.add({
                from: bsnodeId,
                to: id
            });
        }
        flag = true;
    }

    commitList.push({
        sha: c.sha(),
        id: id,
        time: c.timeMs(),
        column: column,
        email: email,
        reference: reference,
        branch: flag,
    });
    // console.log("commit: "+ id + ", message: " + commitList[id-1]['id']); // + ", tags: " + tags[tagid]; ??
}

function makeEdge(sha: string, parentSha: string) {
    let fromNode = getNodeId(parentSha.toString());
    let toNode = getNodeId(sha);

    edges.add({
        from: fromNode,
        to: toNode
    });
}

function getNodeId(sha: string) {
    for (let i = 0; i < commitList.length; i++) {
        let c = commitList[i];
        if (c["sha"] === sha) {
            return c["id"];
        }
    }
}

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
