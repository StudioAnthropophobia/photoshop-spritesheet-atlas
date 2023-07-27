// Keys
const kUserOptionsGlobalStorageKey = "SpriteSheetGeneratorGlobalOptions";
const kUserOptionsAlertOnFinishKey = "alertOnFinish";
const kUserOptionsPrefix = "SpriteSheetGeneratorOptions-";
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

function getUserOptionsStorageKey() {
    return kUserOptionsPrefix + app.activeDocument.name;
}

function storeLastUserOptions(userOptions) {
    // Store options per-document
    const desc = new ActionDescriptor();

    putActionDescValue(desc, "putBoolean", kUserOptionsUseDefaultPathsKey, userOptions[kUserOptionsUseDefaultPathsKey]);
    putActionDescValue(desc, "putString", kUserOptionsPNGPathKey, userOptions[kUserOptionsPNGPathKey]);
    putActionDescValue(desc, "putString", kUserOptionsJSONPathKey, userOptions[kUserOptionsJSONPathKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsPowerOfTwoKey, userOptions[kUserOptionsPowerOfTwoKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsSquareKey, userOptions[kUserOptionsSquareKey]);
    putActionDescValue(desc, "putBoolean", kUserOptionsKeepDestDocOpenKey, userOptions[kUserOptionsKeepDestDocOpenKey]);
    putActionDescValue(desc, "putInteger", kUserOptionsPaddingKey, userOptions[kUserOptionsPaddingKey]);
    putActionDescValue(desc, "putString", kUserOptionsSortByKey, userOptions[kUserOptionsSortByKey]);

    const optionsKey = getUserOptionsStorageKey();
    app.putCustomOptions(optionsKey, desc, true);

    // Store option(s) for entire script
    const globalDesc = new ActionDescriptor();

    putActionDescValue(globalDesc, "putBoolean", kUserOptionsAlertOnFinishKey, userOptions[kUserOptionsAlertOnFinishKey]);
    app.putCustomOptions(kUserOptionsGlobalStorageKey, globalDesc, true);
}

function retrieveLastUserOptions() {
    var globalDesc;
    var desc;
    try {
        globalDesc = app.getCustomOptions(kUserOptionsGlobalStorageKey);
        desc = app.getCustomOptions(getUserOptionsStorageKey());
    } catch (e) {
        return {};
    }

    var result = {};

    result[kUserOptionsUseDefaultPathsKey] = getActionDescValue(desc, "getBoolean", kUserOptionsUseDefaultPathsKey, true);
    result[kUserOptionsPNGPathKey] = getActionDescValue(desc, "getString", kUserOptionsPNGPathKey, "");
    result[kUserOptionsJSONPathKey] = getActionDescValue(desc, "getString", kUserOptionsJSONPathKey, "");
    result[kUserOptionsPowerOfTwoKey] = getActionDescValue(desc, "getBoolean", kUserOptionsPowerOfTwoKey, false);
    result[kUserOptionsSquareKey] = getActionDescValue(desc, "getBoolean", kUserOptionsSquareKey, false);
    result[kUserOptionsKeepDestDocOpenKey] = getActionDescValue(desc, "getBoolean", kUserOptionsKeepDestDocOpenKey, false);
    result[kUserOptionsPaddingKey] = getActionDescValue(desc, "getInteger", kUserOptionsPaddingKey, 1);
    result[kUserOptionsSortByKey] = getActionDescValue(desc, "getString", kUserOptionsSortByKey, optionValueSortByArea);

    result[kUserOptionsAlertOnFinishKey] = getActionDescValue(globalDesc, "getBoolean", kUserOptionsAlertOnFinishKey, true);

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

function getUserOptions(srcDoc) {
    var defaultPaths = composeDefaultFilePaths(srcDoc);
    var lastUserOptions = retrieveLastUserOptions();

    // Build options dialog and set default values

    var dlg = new Window("dialog", "Generate sprite sheet");
    const filePanel = addTitledPanel(dlg, "Output Files");

    // Atlas
    const jsonPicker = new SaveFilePicker(
        "Atlas", "Save Atlas as:",
        "JSON:*.json,All files:*.*",
        defaultPaths.jsonPath);

    jsonPicker.addToContainer(filePanel);

    // Sprite sheet
    const pngPicker = new SaveFilePicker(
        "Sprite sheet", "Save Spritesheet as:",
        "PNG:*.png,All files:*.*",
        defaultPaths.pngPath);

    pngPicker.addToContainer(filePanel);

    // Default paths checkbox
    const defaultPathsCheckBox = new CheckBox("Use default output paths");
    defaultPathsCheckBox.addToContainer(filePanel);
    defaultPathsCheckBox.setOnClick(function() {
        if (this.value === true) {
            jsonPicker.setPath();
            jsonPicker.setEnabled(false);
            pngPicker.setPath();
            pngPicker.setEnabled(false);
        } else {
            jsonPicker.setEnabled(true);
            pngPicker.setEnabled(true);
        }
    });

    // Packing options
    const packingPanel = addTitledPanel(dlg, "Packing Options");

    const pow2CheckBox = new CheckBox("Power-of-two", false);
    pow2CheckBox.addToContainer(packingPanel);

    const squareCheckBox = new CheckBox("Square", false);
    squareCheckBox.addToContainer(packingPanel);

    // Padding
    const paddingInput = new NumberInput("Padding:", "1", "pixels");
    paddingInput.addToContainer(packingPanel);

    // Sort options
    const sortRadioButtons = new RadioButtonSet("Sort layers by:");
    sortRadioButtons.addButton("Area", optionValueSortByArea);
    sortRadioButtons.addButton("Perimeter", optionValueSortByPerimeter);
    sortRadioButtons.addButton("Width", optionValueSortByWidth);
    sortRadioButtons.addButton("Height", optionValueSortByHeight);
    sortRadioButtons.addToContainer(packingPanel);

    // Other options
    const otherPanel = addTitledPanel(dlg, "Other Options");

    const keepOpenCheckBox = new CheckBox("Keep destination document open", false);
    keepOpenCheckBox.addToContainer(otherPanel);

    const alertFinishedCheckBox = new CheckBox("Display alert after script finishes", true);
    alertFinishedCheckBox.addToContainer(otherPanel);

    // "Generate" and "Cancel" buttons
    addCancelAndOKButtons(dlg, "Generate", "Cancel");

    // Before presenting, update from last user options if they exist
    // Undefined values ignored by set functions, can pass directly
    jsonPicker.setPath(lastUserOptions[kUserOptionsJSONPathKey]);
    pngPicker.setPath(lastUserOptions[kUserOptionsPNGPathKey]);
    defaultPathsCheckBox.setValue(lastUserOptions[kUserOptionsUseDefaultPathsKey]);
    pow2CheckBox.setValue(lastUserOptions[kUserOptionsPowerOfTwoKey]);
    squareCheckBox.setValue(lastUserOptions[kUserOptionsSquareKey]);
    paddingInput.setText(lastUserOptions[kUserOptionsPaddingKey]);
    sortRadioButtons.setByValue(lastUserOptions[kUserOptionsSortByKey]);
    keepOpenCheckBox.setValue(lastUserOptions[kUserOptionsKeepDestDocOpenKey]);
    alertFinishedCheckBox.setValue(lastUserOptions[kUserOptionsAlertOnFinishKey]);

    jsonPicker.setEnabled(!defaultPathsCheckBox.getValue());
    pngPicker.setEnabled(!defaultPathsCheckBox.getValue());

    // Present dialog
    dlg.center();
    const dlgResult = dlg.show(); // 1 = ok, 2 = cancel

    if (dlgResult === 2) {
        return false;
    }

    // Build user options object based on dialog input
    const userOptions = {};
    userOptions[kUserOptionsUseDefaultPathsKey] = defaultPathsCheckBox.getValue();
    userOptions[kUserOptionsPNGPathKey] = pngPicker.getPath();
    userOptions[kUserOptionsJSONPathKey] = jsonPicker.getPath();
    userOptions[kUserOptionsPowerOfTwoKey] = pow2CheckBox.getValue();
    userOptions[kUserOptionsSquareKey] = squareCheckBox.getValue();
    userOptions[kUserOptionsKeepDestDocOpenKey] = keepOpenCheckBox.getValue();
    userOptions[kUserOptionsPaddingKey] = paddingInput.parseAsNaturalNumber();
    userOptions[kUserOptionsSortByKey] = sortRadioButtons.getSelectedValue();
    userOptions[kUserOptionsAlertOnFinishKey] = alertFinishedCheckBox.getValue();

    storeLastUserOptions(userOptions);
    return userOptions;
}