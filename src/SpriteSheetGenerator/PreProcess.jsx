function layerIsEmpty(artLayer) {
    const b = [
        artLayer.bounds[0].as("px"),
        artLayer.bounds[1].as("px"),
        artLayer.bounds[2].as("px"),
        artLayer.bounds[3].as("px")
    ];
    return (b[0] + b[1] + b[2] + b[3]) === 0;
}

function layerNeedsDeletion(layer) {
    return (!layer.visible || hasIgnoreTag(layer) || layerIsEmpty(layer));
}

function groupNeedsDeletion(group) {
    return (!group.visible || hasIgnoreTag(group));
}

// Store references to layers and groups that are ignored or merged
function recursivePreProcess(layers, refArrays) {

    for (var i = 0; i < layers.length; i++) {
        var layerObject = layers[i];
        if (layerObject.typename === "ArtLayer") {
            if (layerNeedsDeletion(layerObject)) {
                refArrays.markedForDelete.push(layerObject);
            }
        } else if (layerObject.typename === "LayerSet") {
            if (groupNeedsDeletion(layerObject)) {
                refArrays.markedForDelete.push(layerObject);
            } else {
                if (hasMergeTag(layers[i]))
                    refArrays.markedForMerge.push(layers[i]);
                // Loop through children
                recursivePreProcess(layerObject.layers, refArrays);
            }
        } else
            throw "Layer object is of unknown type.";
    }
}


// Interface /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// Removes invisible and ignored layers, merges groups marked with [M]
function preProcessDocument(targetDoc) {
    var refArrays = {
        markedForDelete: [],
        markedForMerge: []
    };

    recursivePreProcess(targetDoc.layers, refArrays);

    for (var i = 0; i < refArrays.markedForDelete.length; i++) {
        refArrays.markedForDelete[i].remove();
    }

    for (i = 0; i < refArrays.markedForMerge.length; i++) {
        var group = refArrays.markedForMerge[i];
        if (!group) {
            // Deleted in previous step
            continue;
        }
        var name = nameWithoutTags(group.name);
        var mergedLayer = group.merge();
        mergedLayer.name = name;
    }
}