function handleGraphDrop(event:DragEvent){
    //Intended to be easily extendable for future drag and drop handling
    event.preventDefault();
    if(event.dataTransfer){
        //Retrieve payload and convert to JSON
        let payload = JSON.parse(event.dataTransfer!.getData("text"));

        //Perform specified operation
        switch (payload.operation){
            case "stash":
                popStash(payload.index);
                break;
            default:
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