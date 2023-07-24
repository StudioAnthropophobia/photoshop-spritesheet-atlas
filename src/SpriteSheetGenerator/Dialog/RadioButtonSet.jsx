function RadioButtonData(label, valueWhenTrue) {
    this.label = label;
    this.valueWhenTrue = valueWhenTrue;
    this.radioButtonRef = null;
}

function RadioButtonSet(title, defaultIndex) {
    this.title = title;
    this.mainGroupRef = null;
    this.btnGroupRef = null;
    this.buttons = [];
    this.defaultIndex = defaultIndex;
    if (this.defaultIndex === undefined)
        this.defaultIndex = 0;
}

RadioButtonSet.prototype.addButton = function(label, valueWhenTrue) {
    const newButton = new RadioButtonData(label, valueWhenTrue);
    this.buttons.push(newButton);
    return newButton;
};

RadioButtonSet.prototype.getSelectedValue = function() {
    for (var i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].radioButtonRef.value === true) {
            return this.buttons[i].valueWhenTrue;
        }
    }
    throw "Option not selected";
};

RadioButtonSet.prototype.addToContainer = function(container) {
    this.mainGroupRef = container.add("group");
    this.mainGroupRef.orientation = "column";
    this.mainGroupRef.alignment = "left";
    this.mainGroupRef.indent = gDialogConstants.indent;
    this.mainGroupRef.title = this.mainGroupRef.add("statictext", undefined, this.title);
    this.mainGroupRef.title.alignment = "left";
    this.btnGroupRef = this.mainGroupRef.add("group");
    this.btnGroupRef.orientation = "column";
    this.btnGroupRef.alignment = "left";

    for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].radioButtonRef = this.btnGroupRef.add(
            "radiobutton", undefined, this.buttons[i].label);
        this.buttons[i].radioButtonRef.alignment = "left";
        this.buttons[i].radioButtonRef.indent = gDialogConstants.indent;
    }

    this.buttons[this.defaultIndex].radioButtonRef.value = true;
};

RadioButtonSet.prototype.setByIndex = function(index) {
    const btn = this.buttons[index];
    if (btn === undefined)
        return;

    btn.radioButtonRef.value = true;
};

RadioButtonSet.prototype.setByValue = function(value) {
    if (value === undefined)
        return;

    for (var i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].valueWhenTrue === value) {
            this.buttons[i].radioButtonRef.value = true;
            return;
        }
    }
    throw "No such return value in radio button set \"" + this.title + "\".";
};