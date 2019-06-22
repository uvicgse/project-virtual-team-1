function commitShortcut(event :KeyboardEvent){
    if(event.code == "Enter" && event.ctrlKey){
        addAndCommit();
    }
}