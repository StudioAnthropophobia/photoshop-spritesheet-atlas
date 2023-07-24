//@target photoshop
//@script "Sprite sheet generator"

//@include "SpriteSheetGenerator/json2.js"

//@include "SpriteSheetGenerator/ActionTranslate.jsx"
//@include "SpriteSheetGenerator/AtlasFrame.jsx"
//@include "SpriteSheetGenerator/LayerTags.jsx"
//@include "SpriteSheetGenerator/Dialog/Dialog.jsx"
//@include "SpriteSheetGenerator/OutputFiles.jsx"
//@include "SpriteSheetGenerator/PackingTree.jsx"
//@include "SpriteSheetGenerator/PreProcess.jsx"
//@include "SpriteSheetGenerator/SpriteDataCollection.jsx"
//@include "SpriteSheetGenerator/SpriteFrame.jsx"
//@include "SpriteSheetGenerator/UserOptions.jsx"

var gScriptResult;

try {
    // Store old preferences
    var prevRulerUnits = app.preferences.rulerUnits;
    var prevTypeUnits = app.preferences.typeUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;

    var result = main();

    if (result === false) {
        gScriptResult = "cancel";
    } else {
        gScriptResult = "ok";
        alert("Sprite sheet generated successfully.", "Script finished " + "(" + ($.hiresTimer) / 1e6 + " seconds)");
    }
} catch (e) {
    if (app.displayDialogs !== DialogModes.NO) {
        if (e.fileName && e.line)
            alert(e.fileName + " line " + e.line + ": " + e);
        else
            alert(e);
    }
    gScriptResult = "cancel";
} finally {
    // Restore preferences
    app.preferences.rulerUnits = prevRulerUnits;
    app.preferences.typeUnits = prevTypeUnits;
}

gScriptResult;

function main() {

    if (app.documents.length === 0) {
        throw "No open documents.";
    }

    const srcDoc = app.activeDocument;
    const frameData = new SpriteFrameCollection();

    // Open options dialog
    var userOptions = getUserOptions(srcDoc);
    if (userOptions === false) {
        return false;
    }

    // Reset timer
    $.hiresTimer;

    // Duplicate, preprocess document
    const destDoc = srcDoc.duplicate(srcDoc.name + " spritesheet");
    app.activeDocument = destDoc;
    preProcessDocument(destDoc);

    // Walk through doc layers, detect sprite frames and sort
    frameData.buildFromDocument(destDoc);
    frameData.sortWithUserOptions(userOptions);

    // Clean unwanted layers from sheet document
    frameData.removePointLayers();

    // Run the packing algorithm and write output coordinates to layer data
    frameData.packFrames(userOptions);
    destDoc.resizeCanvas(frameData.packedWidth, frameData.packedHeight, AnchorPosition.TOPLEFT);

    // Translate layers
    frameData.translateLayers();

    // Layout layers in the output .psd according to packing result, merge
    destDoc.mergeVisibleLayers();
    destDoc.artLayers[0].name = "Sprite Sheet";

    // Trim the output sprite sheet, if power-of-two dimensions were not requested
    if (!userOptions[kUserOptionsPowerOfTwoKey]) {
        if (!userOptions[kUserOptionsSquareKey])
            destDoc.trim(TrimType.TRANSPARENT);
        else {
            var w = destDoc.width.as("px");
            var h = destDoc.height.as("px");
            var d = Math.max(w, h);
            destDoc.resizeCanvas(d, d);
        }
    }

    // Build final output atlas
    var atlasObject = frameData.createAtlasObject();

    // Save .PNG and atlas files
    exportJSON(atlasObject, userOptions[kUserOptionsJSONPathKey]);
    exportPNG(destDoc, userOptions[kUserOptionsPNGPathKey]);

    // Close output doc if keep open not set, return to original
    if (!userOptions[kUserOptionsKeepDestDocOpenKey]) {
        destDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = srcDoc;
    }

    return true;
}