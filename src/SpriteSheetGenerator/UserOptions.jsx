// Keys
const kUserOptionsKey = "userOptions";
const kUserOptionsDocNameKey = "documentName";
const kUserOptionsUseDefaultPathsKey = "useDefaultPaths";
const kUserOptionsPNGPathKey = "PNGPath";
const kUserOptionsJSONPathKey = "JSONPath";
const kUserOptionsPowerOfTwoKey = "powerOfTwo";
const kUserOptionsSquareKey = "square";
const kUserOptionsKeepDestDocOpenKey = "keepDestDocOpen";
const kUserOptionsPaddingKey = "padding";
const kUserOptionsSortByKey = "sortBy";

const optionValueSortByArea = "area";
const optionValueSortByPerimeter = "perimeter";
const optionValueSortByWidth = "width";
const optionValueSortByHeight = "height";

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

function getUserOptions(srcDoc) {
    var lastUserOptions = retrieveLastUserOptions();
    var defaultPaths = composeDefaultFilePaths(srcDoc);
    var indent = 16;
    // Build options dialog and set default values
    var dlg = new Window("dialog", "Generate sprite sheet");

    dlg.outputOptionsGroup = dlg.add("group");
    dlg.outputOptionsGroup.orientation = "column";
    dlg.outputOptionsGroup.alignment = "left";
    dlg.outputOptionsGroup.label = dlg.outputOptionsGroup.add("statictext", undefined, "Output Files");
    dlg.outputOptionsGroup.label.alignment = "left";

    // JSON file 
    dlg.outputOptionsGroup.jsonTitle = dlg.outputOptionsGroup.add("statictext", undefined, ".json");
    dlg.outputOptionsGroup.jsonTitle.alignment = "left";
    dlg.outputOptionsGroup.jsonTitle.indent = indent;

    dlg.outputOptionsGroup.jsonFileGroup = dlg.outputOptionsGroup.add("group");
    var jsonFileGroup = dlg.outputOptionsGroup.jsonFileGroup;
    jsonFileGroup.orientation = "row";
    jsonFileGroup.alignment = "left";
    jsonFileGroup.indent = indent;
    jsonFileGroup.editText = jsonFileGroup.add("edittext");
    jsonFileGroup.browseButton = jsonFileGroup.add("button", undefined, "Browse...");
    jsonFileGroup.editText.text = defaultPaths.jsonPath;
    jsonFileGroup.fileObject = new File();
    jsonFileGroup.browseButton.onClick = function() {
        var selectedFile = File.saveDialog("Save json file as:", "JSON:*.json,All files:*.*");
        jsonFileGroup.fileObject = selectedFile;
        jsonFileGroup.editText.text = selectedFile;
    };

    // PNG file
    dlg.outputOptionsGroup.pngTitle = dlg.outputOptionsGroup.add("statictext", undefined, ".png");
    dlg.outputOptionsGroup.pngTitle.alignment = "left";
    dlg.outputOptionsGroup.pngTitle.indent = indent;

    dlg.outputOptionsGroup.pngFileGroup = dlg.outputOptionsGroup.add("group");
    var pngFileGroup = dlg.outputOptionsGroup.pngFileGroup;
    pngFileGroup.orientation = "row";
    pngFileGroup.alignment = "left";
    pngFileGroup.indent = indent;
    pngFileGroup.editText = pngFileGroup.add("edittext");
    pngFileGroup.browseButton = pngFileGroup.add("button", undefined, "Browse...");
    pngFileGroup.editText.text = defaultPaths.pngPath;
    pngFileGroup.fileObject = new File();
    pngFileGroup.browseButton.onClick = function() {
        var selectedFile = File.saveDialog("Save png file as:", "PNG:*.png,All files:*.*");
        pngFileGroup.fileObject = selectedFile;
        pngFileGroup.editText.text = selectedFile;
    };

    // Default paths checkbox
    dlg.outputOptionsGroup.defaultCheckBox = dlg.outputOptionsGroup.add("checkbox", undefined, "Default output paths");
    var defaultCheckBox = dlg.outputOptionsGroup.defaultCheckBox;
    defaultCheckBox.alignment = "left";
    defaultCheckBox.indent = indent;
    defaultCheckBox.value = true;
    defaultCheckBox.onClick = function() {
        if (defaultCheckBox.value === true) {
            jsonFileGroup.editText.enabled = false;
            pngFileGroup.editText.enabled = false;
            jsonFileGroup.editText.text = defaultPaths.jsonPath;
            jsonFileGroup.browseButton.enabled = false;
            pngFileGroup.editText.text = defaultPaths.pngPath;
            pngFileGroup.browseButton.enabled = false;
        } else {
            jsonFileGroup.editText.enabled = true;
            pngFileGroup.editText.enabled = true;
            jsonFileGroup.browseButton.enabled = true;
            pngFileGroup.browseButton.enabled = true;
        }
    };

    // Packing options
    dlg.packingOptionsGroup = dlg.add("group");
    dlg.packingOptionsGroup.orientation = "column";
    dlg.packingOptionsGroup.alignment = "left";
    dlg.packingOptionsGroup.label = dlg.packingOptionsGroup.add("StaticText", undefined, "Packing Options");
    dlg.packingOptionsGroup.label.alignment = "left";

    dlg.packingOptionsGroup.pow2CheckBox = dlg.packingOptionsGroup.add("checkbox", undefined, "Power-of-two");
    dlg.packingOptionsGroup.pow2CheckBox.alignment = "left";
    dlg.packingOptionsGroup.pow2CheckBox.indent = indent;
    dlg.packingOptionsGroup.pow2CheckBox.value = true;

    dlg.packingOptionsGroup.squareCheckBox = dlg.packingOptionsGroup.add("checkbox", undefined, "Square");
    dlg.packingOptionsGroup.squareCheckBox.alignment = "left";
    dlg.packingOptionsGroup.squareCheckBox.indent = indent;
    dlg.packingOptionsGroup.squareCheckBox.value = false;

    // Padding
    dlg.packingOptionsGroup.paddingGroup = dlg.packingOptionsGroup.add("group");
    var paddingGroup = dlg.packingOptionsGroup.paddingGroup;
    paddingGroup.orientation = "row";
    paddingGroup.alignment = "left";
    paddingGroup.indent = indent;
    paddingGroup.title = paddingGroup.add("statictext", undefined, "Padding:");

    paddingGroup.editText = paddingGroup.add("edittext", undefined, "1");
    paddingGroup.pxText = paddingGroup.add("statictext", undefined, "pixels");
    paddingGroup.editText.onChanging = function() {
        paddingGroup.editText.text = paddingGroup.editText.text.replace(/[^0-9]/gi, "");
    };

    // Sort options
    dlg.packingOptionsGroup.sortGroup = dlg.packingOptionsGroup.add("group");
    var sortGroup = dlg.packingOptionsGroup.sortGroup;
    sortGroup.orientation = "column";
    sortGroup.alignment = "left";
    sortGroup.indent = indent;
    sortGroup.title = sortGroup.add("statictext", undefined, "Sort layers by:");
    sortGroup.title.alignment = "left";
    sortGroup.radioButtonGroup = sortGroup.add("group");
    sortGroup.radioButtonGroup.orientation = "column";
    sortGroup.radioButtonGroup.alignment = "left";
    const areaSortRadioButton = sortGroup.radioButtonGroup.add("radiobutton", undefined, "Area");
    const perimeterSortRadioButton = sortGroup.radioButtonGroup.add("radiobutton", undefined, "Perimeter");
    const widthSortRadioButton = sortGroup.radioButtonGroup.add("radiobutton", undefined, "Width");
    const heightSortRadioButton = sortGroup.radioButtonGroup.add("radiobutton", undefined, "Height");
    areaSortRadioButton.value = true;
    perimeterSortRadioButton.value = false;
    widthSortRadioButton.value = false;
    heightSortRadioButton.value = false;
    areaSortRadioButton.alignment = "left";
    perimeterSortRadioButton.alignment = "left";
    widthSortRadioButton.alignment = "left";
    heightSortRadioButton.alignment = "left";
    areaSortRadioButton.indent = indent;
    perimeterSortRadioButton.indent = indent;
    widthSortRadioButton.indent = indent;
    heightSortRadioButton.indent = indent;

    // Other
    dlg.otherOptionsGroup = dlg.add("group");
    dlg.otherOptionsGroup.orientation = "column";
    dlg.otherOptionsGroup.alignment = "left";
    dlg.otherOptionsGroup.label = dlg.otherOptionsGroup.add("statictext", undefined, "Other options");
    dlg.otherOptionsGroup.label.alignment = "left";

    dlg.otherOptionsGroup.keepDestDocOpenCheckBox = dlg.otherOptionsGroup.add("checkbox", undefined, "Keep destination document open");
    dlg.otherOptionsGroup.keepDestDocOpenCheckBox.alignment = "left";
    dlg.otherOptionsGroup.keepDestDocOpenCheckBox.indent = indent;
    dlg.otherOptionsGroup.keepDestDocOpenCheckBox.value = false;

    // "Generate" and "Cancel" buttons
    dlg.buttonGrp = dlg.add("group");
    dlg.buttonGrp.generateButton = dlg.buttonGrp.add("button", undefined, "Generate");
    dlg.buttonGrp.cancelButton = dlg.buttonGrp.add("button", undefined, "Cancel");
    dlg.defaultElement = dlg.buttonGrp.generateButton;
    dlg.cancelElement = dlg.buttonGrp.cancelButton;

    // Before presenting, update from last user options if they exist
    if (lastUserOptions[kUserOptionsDocNameKey] === srcDoc.name) {
        if (lastUserOptions[kUserOptionsUseDefaultPathsKey] !== undefined) {
            defaultCheckBox.value = lastUserOptions[kUserOptionsUseDefaultPathsKey];
        }
        if (lastUserOptions[kUserOptionsPNGPathKey] !== undefined) {
            pngFileGroup.editText.text = lastUserOptions[kUserOptionsPNGPathKey];
        }
        if (lastUserOptions[kUserOptionsJSONPathKey] !== undefined) {
            jsonFileGroup.editText.text = lastUserOptions[kUserOptionsJSONPathKey];
        }
        if (lastUserOptions[kUserOptionsPowerOfTwoKey] !== undefined) {
            dlg.packingOptionsGroup.pow2CheckBox.value = lastUserOptions[kUserOptionsPowerOfTwoKey];
        }
        if (lastUserOptions[kUserOptionsSquareKey] !== undefined) {
            dlg.packingOptionsGroup.pow2CheckBox.value = lastUserOptions[kUserOptionsSquareKey];
        }
        if (lastUserOptions[kUserOptionsKeepDestDocOpenKey] !== undefined) {
            dlg.otherOptionsGroup.keepDestDocOpenCheckBox.value = lastUserOptions[kUserOptionsKeepDestDocOpenKey];
        }
        if (lastUserOptions[kUserOptionsPaddingKey] !== undefined) {
            paddingGroup.editText.text = lastUserOptions[kUserOptionsPaddingKey].toString();
        }
        if (lastUserOptions[kUserOptionsSortByKey] !== undefined) {
            var sortOption = lastUserOptions[kUserOptionsSortByKey];
            if (sortOption === optionValueSortByArea)
                areaSortRadioButton.value = true;
            else if (sortOption === optionValueSortByPerimeter)
                perimeterSortRadioButton.value = true;
            else if (sortOption === optionValueSortByWidth)
                widthSortRadioButton.value = true;
            else if (sortOption === optionValueSortByHeight)
                heightSortRadioButton.value = true;
            else
                areaSortRadioButton.value = true;
        }
    }
    if (defaultCheckBox.value === true) {
        jsonFileGroup.editText.enabled = false;
        pngFileGroup.editText.enabled = false;
        jsonFileGroup.browseButton.enabled = false;
        pngFileGroup.browseButton.enabled = false;
    } else {
        jsonFileGroup.editText.enabled = true;
        pngFileGroup.editText.enabled = true;
        jsonFileGroup.browseButton.enabled = true;
        pngFileGroup.browseButton.enabled = true;
    }

    // Present dialog
    dlg.center();
    var dlgResult = dlg.show(); // 1 = ok, 2 = cancel

    // Build user options object based on dialog input
    var userOptions = {};
    userOptions[kUserOptionsDocNameKey] = app.activeDocument.name;
    userOptions[kUserOptionsUseDefaultPathsKey] = defaultCheckBox.value;
    userOptions[kUserOptionsPNGPathKey] = pngFileGroup.editText.text;
    userOptions[kUserOptionsJSONPathKey] = jsonFileGroup.editText.text;
    userOptions[kUserOptionsPowerOfTwoKey] = dlg.packingOptionsGroup.pow2CheckBox.value;
    userOptions[kUserOptionsSquareKey] = dlg.packingOptionsGroup.squareCheckBox.value;
    userOptions[kUserOptionsKeepDestDocOpenKey] = dlg.otherOptionsGroup.keepDestDocOpenCheckBox.value;
    userOptions[kUserOptionsPaddingKey] = parseInt(paddingGroup.editText.text, 10);

    if (areaSortRadioButton.value)
        userOptions[kUserOptionsSortByKey] = optionValueSortByArea;
    else if (perimeterSortRadioButton.value)
        userOptions[kUserOptionsSortByKey] = optionValueSortByPerimeter;
    else if (widthSortRadioButton.value)
        userOptions[kUserOptionsSortByKey] = optionValueSortByWidth;
    else if (heightSortRadioButton.value)
        userOptions[kUserOptionsSortByKey] = optionValueSortByHeight;
    else
        userOptions[kUserOptionsSortByKey] = optionValueSortByArea;

    if (!isNaturalNumber(userOptions[kUserOptionsPaddingKey])) {
        throw "Padding has to be a natural number";
    }

    if (dlgResult === 2) {
        return false;
    }

    storeLastUserOptions(userOptions);
    return userOptions;
}

function storeLastUserOptions(userOptions) {
    const desc = new ActionDescriptor();

    putActionDescValue(desc, "putString", kUserOptionsDocNameKey, userOptions[kUserOptionsDocNameKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsUseDefaultPathsKey, userOptions[kUserOptionsUseDefaultPathsKey]);
    putActionDescValue(desc, "putString", kUserOptionsPNGPathKey, userOptions[kUserOptionsPNGPathKey]);
    putActionDescValue(desc, "putString", kUserOptionsJSONPathKey, userOptions[kUserOptionsJSONPathKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsPowerOfTwoKey, userOptions[kUserOptionsPowerOfTwoKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsSquareKey, userOptions[kUserOptionsSquareKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsKeepDestDocOpenKey, userOptions[kUserOptionsKeepDestDocOpenKey]);
    putActionDescValue(desc, "putInteger", kUserOptionsPaddingKey, userOptions[kUserOptionsPaddingKey]);
    putActionDescValue(desc, "putString", kUserOptionsSortByKey, userOptions[kUserOptionsSortByKey]);

    app.putCustomOptions(kUserOptionsKey, desc, true);
}

function retrieveLastUserOptions() {
    var desc;
    try {
        desc = app.getCustomOptions(kUserOptionsKey);
    } catch (e) {
        return {};
    }

    var result = {};

    result[kUserOptionsDocNameKey] = getActionDescValue(desc, "getString", kUserOptionsDocNameKey, "");
    result[kUserOptionsUseDefaultPathsKey] = getActionDescValue(desc, "getBoolean", kUserOptionsUseDefaultPathsKey, true);
    result[kUserOptionsPNGPathKey] = getActionDescValue(desc, "getString", kUserOptionsPNGPathKey, "");
    result[kUserOptionsJSONPathKey] = getActionDescValue(desc, "getString", kUserOptionsJSONPathKey, "");
    result[kUserOptionsPowerOfTwoKey] = getActionDescValue(desc, "getBoolean", kUserOptionsPowerOfTwoKey, true);
    result[kUserOptionsSquareKey] = getActionDescValue(desc, "getBoolean", kUserOptionsSquareKey, false);
    result[kUserOptionsKeepDestDocOpenKey] = getActionDescValue(desc, "getBoolean", kUserOptionsKeepDestDocOpenKey, false);
    result[kUserOptionsPaddingKey] = getActionDescValue(desc, "getInteger", kUserOptionsPaddingKey, 1);
    result[kUserOptionsSortByKey] = getActionDescValue(desc, "getString", kUserOptionsSortByKey, optionValueSortByArea);

    return result;
}

function toTypeID(stringID) {
    return app.stringIDToTypeID(stringID);
}

function putActionDescValue(desc, method, key, value) {
    if (key === undefined || value === undefined) {
        return;
    }

    desc[method](toTypeID(key), value);
}

function getActionDescValue(desc, method, key, defaultValue) {
    if (desc.hasKey(toTypeID(key))) {
        return desc[method](toTypeID(key));
    }

    return defaultValue;
}