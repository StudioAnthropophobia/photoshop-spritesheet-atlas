function NumberInput(titleText, defaultText, unitText) {
    this.titleText = titleText;
    this.defaultText = defaultText;
    this.unitText = unitText;

    this.groupRef = null;
    this.titleRef = null; // StaticText before EditText
    this.editTextRef = null;
    this.unitTextRef = null; // StaticText after EditText
}

NumberInput.prototype.addToContainer = function(container) {
    this.groupRef = container.add("group");
    this.groupRef.orientation = "row";
    this.groupRef.alignment = "left";
    this.groupRef.indent = gDialogConstants.indent;
    this.titleRef = this.groupRef.add("statictext", undefined, this.titleText);
    this.editTextRef = this.groupRef.add("edittext", undefined, this.defaultText);
    this.unitTextRef = this.groupRef.add("statictext", undefined, this.unitText);
    this.editTextRef.onChanging = function() {
        this.text = this.text.replace(/[^.0-9-]/gi, "");
    };
};

NumberInput.prototype.parseAsInteger = function() {
    return parseInt(this.editTextRef.text, 10);
};

function isNaturalNumber(num) {
    if (typeof(num) !== "number") {
        return false;
    }
    if (num >= 0 && Math.floor(num) === num && num !== Infinity) {
        return true;
    } else {
        return false;
    }
}

NumberInput.prototype.parseAsNaturalNumber = function() {
    var num = this.parseAsInteger();
    if (!isNaturalNumber(num))
        throw "Number input \"" + this.titleText + "\" requires input to be a natural number";

    return num;
};

NumberInput.prototype.getText = function() {
    return this.editTextRef.text;
};

NumberInput.prototype.setText = function(text) {
    if (text === undefined)
        return;

    this.editTextRef.text = text.toString();
};