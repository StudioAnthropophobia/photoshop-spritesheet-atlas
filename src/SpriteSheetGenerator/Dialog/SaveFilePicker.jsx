function SaveFilePicker(labelText, prompt, preset, defaultPath) {
    this.labelText = labelText;
    this.prompt = prompt;
    this.preset = preset;
    this.defaultPath = defaultPath;

    this.vertGroup = null;
    this.labelStaticText = null;
    this.horGroup = null;
    this.editTextRef = null;
    this.browseButtonRef = null;
    this.fileObject = null;
}

SaveFilePicker.prototype.addToContainer = function(container) {

    this.vertGroup = container.add("group");
    this.vertGroup.orientation = "column";
    this.vertGroup.indent = gDialogConstants.indent;
    this.vertGroup.alignment = "left";
    this.labelStaticText = this.vertGroup.add("statictext", undefined, this.labelText);
    this.labelStaticText.alignment = "left";
    this.horGroup = this.vertGroup.add("group");
    this.horGroup.orientation = "row";
    this.horGroup.alignment = "left";
    this.editTextRef = this.horGroup.add("edittext");
    this.browseButtonRef = this.horGroup.add("button", undefined, "Browse...");
    this.browseButtonRef.parentPicker = this;
    this.editTextRef.text = this.defaultPath;
    this.fileObject = new File(this.defaultPath);
    this.browseButtonRef.onClick = function() {
        // "this" refers to button
        const thisP = this.parentPicker;
        const prevFile = thisP.editTextRef.text;
        // Restore previous file if user cancels dialog
        var selectedFile = File.saveDialog(thisP.prompt, thisP.preset);
        if (!selectedFile) {
            selectedFile = prevFile;
        }
        thisP.fileObject.changePath(selectedFile);
        thisP.editTextRef.text = selectedFile;
    };
};

SaveFilePicker.prototype.setEnabled = function(enabled) {
    this.editTextRef.enabled = enabled;
    this.browseButtonRef.enabled = enabled;
};

SaveFilePicker.prototype.setPath = function(path) {
    if (path === undefined)
        this.editTextRef.text = this.defaultPath;
    else
        this.editTextRef.text = path;

};

SaveFilePicker.prototype.getPath = function() {
    return this.editTextRef.text;
};