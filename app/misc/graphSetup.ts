import * as nodegit from "git";
import * as simplegit from 'simple-git/promise';
let sGit = require( 'simple-git/promise' );

let vis = require("vis");
let $ = require("jquery");
let options, bsNodes, bsEdges, nodes, edges, network;
let secP = null, fromNode = null, toNode;

let GraphNodeID = 0;
var resetNodeMenuItem = undefined

function returnSelectedNodeValue (): number
{
    let returnValue = GraphNodeID;
    GraphNodeID = 0;
    return returnValue;
}

function drawGraph() {
    updateGraphProgress(0);
    document.getElementById('graph-loading').style.display = 'block';
    $('#modal').modal('show');
    bsNodes = new vis.DataSet([]);
    bsEdges = new vis.DataSet([]);

    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);

    // create a network
    let container = document.getElementById("my-network");
    container.innerHTML = '';

    let bsData = {
        nodes: bsNodes,
        edges: bsEdges
    }

    let data = {
        nodes: nodes,
        edges: edges
    };

    options = {

        configure: {
            enabled: false,
        },

        edges: {
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.6
                },
                middle: false,
                from: false,
            },
            color: "#39c0ba",
            hoverWidth: 0,
            physics: false,
            selectionWidth: 0,
            shadow: true,
            smooth: {
                enabled: true,
                type: "cubicBezier",
                // forceDirection: "horizontal",
                roundness: 0.5
            },
            width: 3,
        },

        groups: {},

        interaction: {
            dragNodes: true,
            dragView: true,
            hideEdgesOnDrag: false,
            hideNodesOnDrag: false,
            hover: true,
            hoverConnectedEdges: false,
            keyboard: {
                enabled: false,
                speed: {x: 10, y: 10, zoom: 0.02},
                bindToWindow: true
            },
            multiselect: false,
            navigationButtons: false,
            selectable: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
        },

        layout: {
            randomSeed: 1,
            improvedLayout: true,
        },

        manipulation: {
            enabled: false,
            initiallyActive: false,
            addNode: true,
            addEdge: true,
            editEdge: true,
            deleteNode: true,
            deleteEdge: true,
            controlNodeStyle: {
                shape: "dot",
                size: 6,
                color: {
                    background: "#39c0ba",
                    border: "#39c0ba",
                    highlight: {
                        background: "#07f968",
                        border: "#3c3c3c"
                    }
                },
                borderWidth: 2,
                borderWidthSelected: 2,
            }
        },

        nodes: {
            borderWidth: 8,
            borderWidthSelected: 8,
            color: {
                border: "#39c0ba",
                background: "#FFF",
                highlight: {
                    border: "#FF0",
                    background: "#FFF"
                },
                hover: {
                    border: "#F00",
                    background: "#FFF"
                },
            },
            shadow: true,
        },

        physics: {
            enabled: false,
        },
    };
    network = new vis.Network(container, bsData, options);
    getAllCommits( function ( commits ){
        // first fetching local commit so that we can mark them during processGraph
        aheadCommitList=[]
        let sGitRepo = sGit(repoFullPath);
        sGitRepo.silent( true ).log( { '--branches': null, '--not': null, '--remotes': null } ).then( ( result ) =>
        {
            //collect all branches unpush commits using:- git log --branches --not --remotes
            for ( let k = 0; k < result.all.length; k++ )
            {
                aheadCommitList.push( result.all[ k ].hash );
            }
        } ).then(() => sGitRepo.silent( true ).log( { 'origin/master..master': null } )).then(( result ) =>
        {
            //add unpush commit on master using:- git log origin/master..master
            for ( let k = 0; k < result.all.length; k++ )
            {
                aheadCommitList.push( result.all[ k ].hash );
            }
        }).catch(function (err) {
            console.log("ERROR: unable to load local only commits because: "+err.message);
        } ).then( function (){
            processGraph( commits );
        } ).catch( function ( err ){
            console.log("ERROR loading local commits: " + err)
        } );


        network.on("stabilizationIterationsDone", function () {
            network.setOptions({physics: false});
        });

        network.on("doubleClick", function (callback) {
            if (callback.nodes[0] === undefined) {
                return;
            } else {
                let nodeId: number = callback.nodes[0];
            }

            let moveOptions = {
                offset: {x: 0, y: 0},
                scale: 1,
                animation: {
                    duration: 1000,
                    easingFunction: "easeInOutQuad",
                }
            };

            network.focus(callback.nodes[0], moveOptions);
        }, false);

        let flag = "basic";

        network.on("zoom", function (callback) {
            let moveOptions = {
                scale: 1,
                animation: {
                    duration: 1000,
                    easingFunction: "easeInOutQuad",
                }
            };

            if (network.getScale() > 1.5 && callback.direction === '+' && flag === 'basic') {
                network.setData(data);
                flag = 'node';
                network.fit(moveOptions);
            } else if (network.getScale() < 0.4 && callback.direction === '-' && flag === 'node') {
                network.setData(bsData);
                flag = 'basic';
                network.fit(moveOptions);
            }
        }, false);

        // Add finished animation finished handler to network
        network.on("animationFinished", function () {
            if (fromNode !== null && secP !== null) {
                let toNode = network.getNodeAt(secP);

                if (fromNode !== toNode && (nodes.get(fromNode)['shape'] === 'box') && (nodes.get(toNode)['shape'] === 'box')) {
                    mergeCommits(nodes.get(fromNode)['title']);
                }
            }
            fromNode = null;
            secP = null;
        });

        // Add context menu handler to network
        network.on('oncontext', function (properties) {
            if (flag === 'node') { // Only show context menu at the lowest zoom level
                let contextNode = nodes.get(network.getNodeAt(properties.pointer.DOM));
                if (contextNode.nodeType == NodeType.Node) { // Only show context menu for nodes (not branches/tags)
                    let contextMenu = $("#networkContext");
                    contextMenu.css({
                        top: properties.event.pageY + "px",
                        left: properties.event.pageX + "px"
                    } );
                    if ( resetNodeMenuItem == undefined )
                    {
                        resetNodeMenuItem = $( "#rightClickMenuItemReset" );
                    }
                    if ( aheadCommitList.includes( contextNode.commitSha ) )
                    {
                        let contextMenuItems = $( "#nodeRightClickMenu" );
                        contextMenuItems.append( resetNodeMenuItem );
                    } else
                    {
                        resetNodeMenuItem.remove();
                    }
                    contextMenu.finish().toggle();
                    contextMenu.focus();

                    selectedCommit = contextNode.commitSha;
                }
            }
        });

        // Add click handler to network
        network.on('click', function (properties) {
            if (properties.nodes.length > 0) {
                let clicknode = properties.nodes[0];

                if (flag === 'node') {
                    clicknode = nodes.get(clicknode);
					displaySelectedCommitDiffPanel(properties.nodes[0]);
                } else if (flag === 'basic') {
                    clicknode = bsNodes.get(clicknode);
                } else {
                    clicknode = undefined;
                }

                if (clicknode != undefined) {
                    let name = clicknode.author.name().toString();
                    let email = clicknode.author.email().toString();

                    document.getElementById("authorModalDetails")!.innerHTML = "Author Name: " + clicknode.author.toString() + "<br>" + "Email: " + email;
                    document.getElementById("authorModalProfileButton")!.onclick = function () {
                        window.open("https://github.com/" + name, "Author Profile");
                    }

                    imageForUser(name, email, function (pic) {
                        document.getElementById("authorModalImage")!.src = pic;
                        $("#authorProfileModal").modal('show');
                    })
                }
            }
        })

        // Clicking on the network disables the context menu
        network.on("click", function (properties) {
            let contextMenu = $("#networkContext")
            contextMenu.hide()
        });

        // Dragging on the network disables the context menu
        network.on("dragStart", function (properties) {
            let contextMenu = $("#networkContext")
            contextMenu.hide()
        });


    })
}

function showDiff(commitId): void {
    let commitPanelBody = document.getElementById("commit-diff-panel-body");
    if (commitPanelBody != null) {
      commitPanelBody.innerHTML = "";
      Git.Repository.open(repoFullPath).then(function(repository){
        return repository.getCommit(commitList[commitId-1].sha);
      }).then(function(commit){
        return commit.getDiff()
      }).then(function (arrayDiff) {
        return arrayDiff[0].patches();
      }).then(function (patches) {
        patches.forEach(function (patch) {
          patch.hunks().then(function (hunks) {
            hunks.forEach(function(hunk){
              hunk.lines().then(function(lines){
                let oldFilePath = patch.oldFile().path();
                let newFilePath = patch.newFile().path();
                lines.forEach(function(line){
                  if(line.origin()!=62){
                    line = String.fromCharCode(line.origin())
                      + (line.oldLineno() != -1 ? line.oldLineno() : "")
                      + "\t" + (line.newLineno() != -1 ? line.newLineno() : "")
                      + "\t" + String.fromCharCode(line.origin())
                      + "\t" + line.content();

                    let element = document.createElement("div");
                    element.classList.add("diffChangeText");

                    if (line.charAt(0) === "+") {
                      element.style.backgroundColor = "rgba(132,219,0,0.7)"
                    } else if (line.charAt(0) === "-") {
                      element.style.backgroundColor = "rgba(255,36,72,0.6)";
                    }

                    // If not a changed line, origin will be a space character, so still need to slice
                    line = line.slice(1, line.length);
                    element.textContent = line;

                    // The spacer is needed to pad out the line to highlight the whole row
                    let spacer = document.createElement("spacer");
                    spacer.style.width = commitPanelBody!.scrollWidth+"px";
                    element.appendChild(spacer);
                    commitPanelBody.appendChild(element);
                  }
                })
              })
            })
          })
        })
      });
    }
  }

function displaySelectedCommitDiffPanel(commitId): void {
    let closeButton = document.getElementById("commit-close");
    if (closeButton != null) {
      closeButton.style.display = "inline";
    }
    let commitPanel = document.getElementById("selected-commit-diff-panel");
    // To help with understanding order of operations:
    // console.log("Inside display selected commit.");
    if (commitPanel != null) {
      commitPanel.style.height = "100vh";
      commitPanel.style.width = "100vw";
      commitPanel.style.zIndex = "10";
    }

    let bodyPanel = document.getElementById("commit-diff-panel-body");
    if (bodyPanel != null) {
      bodyPanel.style.display = "block";
    }
    showDiff(commitId);

    let footer = document.getElementById("footer");
    if (footer != null) {
      footer.hidden = true;
    }

    let editorPanel = document.getElementById("editor-panel");
    if (editorPanel != null){
      editorPanel.hidden = true;
    }
}
