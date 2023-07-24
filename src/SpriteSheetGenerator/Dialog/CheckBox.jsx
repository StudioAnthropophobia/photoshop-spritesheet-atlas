function CheckBox(title, defaultValue) {
    this.title = title;
    this.checkBoxRef = null;
    this.defaultValue = defaultValue;
}

CheckBox.prototype.addToContainer = function(container) {
    this.checkBoxRef = container.add("checkbox", undefined, this.title);
    this.checkBoxRef.alignment = "left";
    this.checkBoxRef.indent = gDialogConstants.indent;
    this.checkBoxRef.value = this.defaultValue;
};

CheckBox.prototype.setValue = function(value) {
    if (value === undefined)
        return;

    this.checkBoxRef.value = value;
};

CheckBox.prototype.getValue = function() {
    return this.checkBoxRef.value;
};

CheckBox.prototype.setOnClick = function(fn) {
    this.checkBoxRef.onClick = fn;
};