function layerIsEmpty(artLayer) {
    const b = artLayer.bounds;
    return !(b[3].value || b[2].value || b[1].value || b[0].value);
}

function layerNeedsDeletion(layer) {
    return (!layer.visible || hasIgnoreTag(layer) || layerIsEmpty(layer));
}

function groupNeedsDeletion(group) {
    return (!group.visible || hasIgnoreTag(group));
}

function preProcessArtLayer(artLayer, deleteIDArray) {
    if (layerNeedsDeletion(artLayer)) {
        deleteIDArray.push(artLayer.id);
    }
}

function preProcessLayerSet(layerSet, idArrays) {
    if (groupNeedsDeletion(layerSet)) {
        idArrays.markedForDelete.push(layerSet.id);
    } else {
        if (hasMergeTag(layerSet)) {
            // Store ID, remove [M] tag from name
            idArrays.markedForMerge.push(layerSet.id);
            layerSet.name = nameWithoutTags(layerSet.name);
        }
        // Handle child layerSets and artLayers
        var len = layerSet.layerSets.length;
        for (var i = 0; i < len; ++i)
            preProcessLayerSet(layerSet.layerSets[i], idArrays);

        len = layerSet.artLayers.length;
        for (i = 0; i < len; ++i)
            preProcessArtLayer(layerSet.artLayers[i], idArrays.markedForDelete);
    }
}

// Interface /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// Removes invisible and ignored layers, merges groups marked with [M]
function preProcessDocument(targetDoc) {
    var idArrays = {
        markedForDelete: [],
        markedForMerge: []
    };
    var len = targetDoc.layerSets.length;
    for (var i = 0; i < len; ++i)
        preProcessLayerSet(targetDoc.layerSets[i], idArrays);

    len = targetDoc.artLayers.length;
    for (i = 0; i < len; ++i)
        preProcessArtLayer(targetDoc.artLayers[i], idArrays.markedForDelete);

    selectLayersFromIDList(idArrays.markedForDelete);
    deleteSelectedLayers();

    const merged = idArrays.markedForMerge;
    len = merged.length;
    for (i = 0; i < len; ++i) {
        // Group might be deleted in previous step -> invalid id
        // Nested [M] groups -> invalid id
        // This is fine, just wrap in try-catch to ignore error
        try {
            mergeGroupByID(merged[i]);
        } catch (e) {}

    }
}