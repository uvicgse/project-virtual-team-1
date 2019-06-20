function commitShortcut(event :KeyboardEvent){
    console.log(event);
    if(event.code == "Enter" && event.ctrlKey){
        addAndCommit();
    }
}