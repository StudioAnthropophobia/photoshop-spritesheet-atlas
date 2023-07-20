// Get a flat ArtLayer array (without groups/hierarchy)
function getAllArtLayers(srcDoc) {
    var allArtLayers = [];
    for (var i = 0; i < srcDoc.layers.length; i++) {
        var layer = srcDoc.layers[i];
        if (layer.typename === "LayerSet") {
            if (hasMergeTag(layer)) {
                allArtLayers.push(layer);
            } else {
                allArtLayers = allArtLayers.concat(getAllArtLayers(layer));
            }
        } else if (layer.typename === "ArtLayer") {
            allArtLayers.push(layer);
        } else {
            throw "Layer is of unknown type";
        }
    }
    return allArtLayers;
}

function copyArtLayersToDoc(srcDoc, destDoc) {
    const layers = getAllArtLayers(srcDoc);
    app.activeDocument = srcDoc;

    for (var i = 0; i < layers.length; i++) {
        if (hasPointTag(layers[i]) || layers[i].isBackgroundLayer) {
            continue;
        }
        layers[i].duplicate(destDoc, ElementPlacement.PLACEATEND);
    }

    // Delete the white layer 
    app.activeDocument = destDoc;
    destDoc.layers[destDoc.layers.length - 1].remove();
}

// Walk recursively through layer objects, store references to groups marked with [M]
function recursiveMarkForMerge(layers) {
    var markedLayers = [];

    for (var i = 0; i < layers.length; i++) {
        if (layers[i].typename === "LayerSet") {
            if (hasMergeTag(layers[i])) {
                markedLayers.push(layers[i]);
            } else {
                // Loop through children
                markedLayers = markedLayers.concat(recursiveMarkForMerge(layers[i].layers));
            }
        }
    }
    return markedLayers;
}

function mergeMarkedLayerGroups(targetDoc) {
    var marked = recursiveMarkForMerge(targetDoc.layers);
    for (var i = 0; i < marked.length; i++) {
        var group = marked[i];
        var name = nameWithoutTags(group.name);
        var mergedLayer = group.merge();
        mergedLayer.name = name;
    }
}

// Store references to layers and groups that are invisible, or tagged with [I]
function recursiveMarkForDelete(layers) {
    var markedLayers = [];
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].typename === "ArtLayer") {
            if (!layers[i].visible || hasIgnoreTag(layers[i])) {
                markedLayers.push(layers[i]);
            }
        } else if (layers[i].typename === "LayerSet") {
            // Whole layerset is invisible, no need to loop through children
            if (!layers[i].visible || hasIgnoreTag(layers[i])) {
                markedLayers.push(layers[i]);
            } else {
                // Loop through children
                markedLayers = markedLayers.concat(recursiveMarkForDelete(layers[i].layers));
            }
        } else
            throw "Layer object is of unknown type.";
    }
    return markedLayers;
}

function deleteInvisibleLayerObjects(targetDoc) {
    var markedForDelete = recursiveMarkForDelete(targetDoc.layers);
    for (var i = 0; i < markedForDelete.length; i++) {
        markedForDelete[i].remove();
    }
}

// Removes invisible and ignored layers, merges groups marked with [M]
function preProcessDocument(targetDoc) {
    deleteInvisibleLayerObjects(targetDoc);
    mergeMarkedLayerGroups(targetDoc);
}