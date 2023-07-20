//@target photoshop
//@script "Sprite sheet generator"

//@include "SpriteSheetGenerator/json2.js"
//@include "SpriteSheetGenerator/LayerActions.jsx"
//@include "SpriteSheetGenerator/LayerData.jsx"
//@include "SpriteSheetGenerator/PrunedLayerData.jsx"
//@include "SpriteSheetGenerator/LayerTags.jsx"
//@include "SpriteSheetGenerator/OutputFiles.jsx"
//@include "SpriteSheetGenerator/PackingTree.jsx"
//@include "SpriteSheetGenerator/UserOptions.jsx"

var gScriptResult;

try {
    var result = main();
    if (result === false) {
        gScriptResult = "cancel";
    } else {
        gScriptResult = "ok";
        alert("Sprite sheet generated successfully.", "Script finished");
    }
} catch (e) {
    if (app.displayDialogs !== DialogModes.NO) {
        if (e.fileName && e.line)
            alert(e.fileName + " line " + e.line + ": " + e);
        else
            alert(e);
    }

    gScriptResult = "cancel";
}

gScriptResult;

function main() {
    // Store old preferences
    var prevRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    if (app.documents.length === 0) {
        throw "No open documents.";
    }

    const srcDoc = app.activeDocument;
    var layerData = [];
    var packingOutput = {};
    // Open options dialog
    var userOptions = getUserOptions(srcDoc);
    if (userOptions === false) {
        return false;
    }

    // Duplicate and preprocess document
    var preProcessedDoc = srcDoc.duplicate(srcDoc.name + " Preprocessed");
    app.activeDocument = preProcessedDoc;
    preProcessDocument(preProcessedDoc);
    // Walk through doc layers and build layer data
    layerData = buildLayerData(preProcessedDoc.layers);

    // Run the packing algorithm on layer data
    packingOutput = packLayers(layerData, userOptions);

    // Create the output .psd document
    var destDoc = createDestDoc(preProcessedDoc, srcDoc.name + "Spritesheet", packingOutput.width, packingOutput.height);
    if (destDoc === false)
        throw "Destination document could not be created.";

    // Copy layers into the output psd
    copyArtLayersToDoc(preProcessedDoc, destDoc);

    // Close preprocessed doc, no longer needed
    preProcessedDoc.close(SaveOptions.DONOTSAVECHANGES);

    // Layout layers in the output .psd to the final form, merge
    translateLayers(destDoc, layerData);
    destDoc.mergeVisibleLayers();
    destDoc.layers[0].name = "Sprite Sheet";

    // Trim output if power-of-two dimensions not set
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

    // Prune layer data
    var prunedLayerData = pruneLayerData(layerData);

    // Save .PNG and atlas files
    exportJSON(prunedLayerData, userOptions[kUserOptionsJSONPathKey]);
    exportPNG(destDoc, userOptions[kUserOptionsPNGPathKey]);

    // Close destination .psd 
    if (!userOptions[kUserOptionsKeepDestDocOpenKey])
        destDoc.close(SaveOptions.DONOTSAVECHANGES);

    // Restore preferences
    app.preferences.rulerUnits = prevRulerUnits;

    return true;
}

function createDestDoc(srcDoc, name, width, height) {
    var destDoc = false;
    destDoc = app.documents.add(width, height, srcDoc.resolution, name);
    app.activeDocument = destDoc;
    return destDoc;
}

function translateLayers(destDoc, layerDataArray) {
    app.activeDocument = destDoc;
    for (var i = 0; i < layerDataArray.length; i++) {
        var layerData = layerDataArray[i];
        if (layerData.isArray) {
            translateLayers(destDoc, layerData.layers);
        } else {
            var layer = destDoc.artLayers.getByName(layerData.name);
            var curX = layer.bounds[0].as("px");
            var curY = layer.bounds[1].as("px");
            layer.translate(layerData.destPos.x - curX, layerData.destPos.y - curY);
        }
    }
}