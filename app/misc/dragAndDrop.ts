function handleGraphDrop(event:DragEvent){
    //Intended to be easily extendable for future drag and drop handling
    if(event.dataTransfer){
        let payloadString = event.dataTransfer.getData("text");
        if (payloadString != ""){
            //Retrieve payload and convert to JSON
            let payload = JSON.parse(payloadString);

            //Perform specified operation
            switch (payload.operation){
                case "stash":
                    popStash(payload.index);
                    break;
                case "commit":
                    addAndCommit();
                    break;
                default:
            }
        }
        
    }
}

function allowDrop(event:DragEvent){
    event.preventDefault();
}

function handleStashApplyZoneDrop(event:DragEvent){
    event.preventDefault();
    if(event.dataTransfer){
        //Retrieve payload and convert to JSON
        let payload = JSON.parse(event.dataTransfer!.getData("text"));

        if(payload.operation == "stash"){
            applyStash(payload.index);
        }
    }
}

function handleStashDropZoneDrop(event:DragEvent){
    event.preventDefault();
    if(event.dataTransfer){
        //Retrieve payload and convert to JSON
        let payload = JSON.parse(event.dataTransfer!.getData("text"));

        if(payload.operation == "stash"){
            dropStash(payload.index);
        }
    }
}

function handleCommitBoxDragStart(event:DragEvent){
    document.getElementById("graph-panel")!.classList.add("dropzone");
    event.dataTransfer!.effectAllowed = 'move';
    //generate data payload
    let payload = {
        operation: "commit",
        index: undefined
    };
    event.dataTransfer!.setData("text", JSON.stringify(payload));
}

function handleCommitBoxDragEnd(event:DragEvent){
    //remove dropzone styling
    document.getElementById("graph-panel")!.classList.remove("dropzone");
}