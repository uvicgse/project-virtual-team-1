function handleGraphDrop(event:DragEvent){
    //Intended to be easily extendable for future drag and drop handling
    event.preventDefault();
    if(event.dataTransfer){
        //Retrieve payload and convert to JSON
        let payload = JSON.parse(event.dataTransfer!.getData("text"));

        //Perform specified operation
        switch (payload.operation){
            case "stash pop":
                popStash(payload.index);
                break;
            default:
        }
    }
}

function allowDrop(event:DragEvent){
    event.preventDefault();
}