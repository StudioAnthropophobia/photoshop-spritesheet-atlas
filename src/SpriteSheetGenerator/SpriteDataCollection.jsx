// Top-level collection describing all sprite frames extracted from a document
function SpriteFrameCollection() {
    // Store ids to point layers for easy deletion later on
    this.pointLayerIDs = [];

    // Store a flat array of references to all SpriteFrames for packing
    // (Includes references to frames wrapped inside SpriteFrameArrays as well)
    this.spriteFrameRefs = [];

    // Plain SpriteFrame objects
    this.spriteFrames = [];

    // SpriteFrameArray objects
    this.spriteFrameArrays = [];

    // Context for traversing the document layer structure
    this.context = {
        parentFrameStack: [], // Stack of refs to SpriteFrames, for nested [R] groups
        currentArray: null // Reference to current SpriteFrameArray
    };

    // Keep track of total pixel area, used in packing algorithm later
    this.totalPixelArea = 0;

    // Resulting sheet dimensions from packing algorithm
    this.packedWidth = 0;
    this.packedHeight = 0;

    // Plain array of numbers in sets of three: layerID, deltaX, deltaY ... 
    this.translationData = [];
}

SpriteFrameCollection.prototype.getCurrentParent = function() {
    return this.context.parentFrameStack[this.context.parentFrameStack.length - 1];
};

SpriteFrameCollection.prototype.pushParentFrame = function(newParentFrame) {
    this.context.parentFrameStack.push(newParentFrame);
};

SpriteFrameCollection.prototype.popParentFrame = function() {
    this.context.parentFrameStack.pop();
};

SpriteFrameCollection.prototype.exitArray = function() {
    this.context.currentArray = null;
};

SpriteFrameCollection.prototype.enterArray = function(newArray) {
    this.context.currentArray = newArray;
};

// Add new frame according to current context
SpriteFrameCollection.prototype.addFrameFromLayer = function(layer) {
    const newFrame = new SpriteFrame(layer, this.getCurrentParent());

    if (this.context.currentArray) {
        this.context.currentArray.addFrame(newFrame);
    } else {
        this.spriteFrames.push(newFrame);
    }

    // Store the frame's area
    this.totalPixelArea += newFrame.getArea();

    // Store reference to new SpriteFrame in flat array
    this.spriteFrameRefs.push(newFrame);
    return newFrame;
};

// Add new array and set it to current context
SpriteFrameCollection.prototype.addFrameArrayFromGroup = function(group) {
    const taglessName = nameWithoutTags(group.name);
    // Check for nested arrays
    if (this.context.currentArray)
        throw ("Error at \"" + group.name + "\": Nested arrays are not supported. Check you document's layer structure.");

    // Create new array
    const newArray = new SpriteFrameArray(taglessName);
    this.spriteFrameArrays.push(newArray);
    return newArray;
};

SpriteFrameCollection.prototype.addPointToCurrentParent = function(pointLayer) {
    // Require parent frame
    const parentSpriteFrame = this.getCurrentParent();
    if (!parentSpriteFrame) {
        throw ("Point layer \"" + pointLayer.name + "\" has no parent; \
        check the layer structure of your document.");
    }

    // Add the point to parent frame
    const bounds = pointLayer.bounds;
    const parentPos = parentSpriteFrame.srcPos;
    const newPoint = new Point2D(
        bounds[0].value - parentPos.x,
        bounds[1].value - parentPos.y);

    parentSpriteFrame.points[nameWithoutTags(pointLayer.name)] = newPoint;

    // Store reference to layer
    this.pointLayerIDs.push(pointLayer.id);
    return null;
};

SpriteFrameCollection.prototype.handleGroup = function(group) {
    if (hasRelPosTag(group)) {
        // Group marked with [R]
        this.handleRelPosGroup(group);
    } else if (hasArrayTag(group)) {
        // Group is marked with [A]
        this.handleArrayGroup(group);
    } else {
        // Group is just a plain group for organizing
        const childSets = group.layerSets;
        const sLen = childSets.length;
        for (var i = 0; i < sLen; ++i) {
            this.handleGroup(childSets[i]);
        }

        const childLayers = group.artLayers;
        const aLen = childLayers.length;
        for (i = 0; i < aLen; ++i) {
            this.handleArtLayer(childLayers[i]);
        }
    }
};

SpriteFrameCollection.prototype.handleRelPosGroup = function(layerGroup) {
    // Require the group to contain a single ArtLayer
    // Try to find it (can be at any index)
    var artLayersInThisGroup = 0;
    var newParentArtLayer = null;

    const artLayers = layerGroup.artLayers;
    const aLen = artLayers.length;
    for (var i = 0; i < aLen; ++i) {
        var layer = artLayers[i];
        if (!hasPointTag(layer)) {
            ++artLayersInThisGroup;
            newParentArtLayer = layer;
        }
    }

    if (artLayersInThisGroup !== 1) {
        throw ("Group\"" + layerGroup.name + "\" needs to contain a single ArtLayer (or [M] group) at its root level. \
            Check the layer structure of your document!");
    }

    // Single parent layer was found, generate sprite frame
    const newParentSpriteFrame = this.handleArtLayer(newParentArtLayer);

    // Push new parent layer to context
    this.pushParentFrame(newParentSpriteFrame);

    // Handle rest of the layerobjects in this group, skipping the already handled ArtLayer.
    // Art layers
    const newParentID = newParentArtLayer.id;
    for (i = 0; i < aLen; ++i) {
        var artLayer = artLayers[i];
        if (artLayer.id !== newParentID) {
            this.handleArtLayer(artLayer);
        }
    }
    // Layer sets
    const layerSets = layerGroup.layerSets;
    const sLen = layerSets.length;
    for (i = 0; i < sLen; ++i) {
        this.handleGroup(layerSets[i]);
    }

    // Pop parent from context after all done
    this.popParentFrame();
};

SpriteFrameCollection.prototype.handleArrayGroup = function(layerGroup) {
    // Push new array to collection
    const newArray = this.addFrameArrayFromGroup(layerGroup);

    // Update context
    this.enterArray(newArray);

    // Handle children. Order matters -> cannot handle groups & layers separately 
    const childLayers = layerGroup.layers;
    const len = childLayers.length;
    for (var i = 0; i < len; ++i) {
        var layer = childLayers[i];
        if (layer.typename === "LayerSet") {
            this.handleGroup(layer);
        } else { //  ArtLayer
            this.handleArtLayer(layer);
        }
    }

    // Update context
    this.exitArray();
};

SpriteFrameCollection.prototype.handleArtLayer = function(layer) {
    if (hasPointTag(layer)) {
        return this.addPointToCurrentParent(layer);
    } else {
        return this.addFrameFromLayer(layer);
    }
};

// Interface /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

SpriteFrameCollection.prototype.buildFromDocument = function(srcDoc) {

    const artLayers = srcDoc.artLayers;
    const aLen = artLayers.length;
    for (var i = 0; i < aLen; ++i) {
        var layer = artLayers[i];
        if (!layer.isBackgroundLayer) {
            this.handleArtLayer(layer);
        }
    }

    const layerSets = srcDoc.layerSets;
    const sLen = layerSets.length;
    for (i = 0; i < sLen; ++i) {
        var lSet = layerSets[i];
        this.handleGroup(lSet);
    }

};

SpriteFrameCollection.prototype.sortWithUserOptions = function(userOptions) {
    // Decide sort function based on user options
    var sortingFunctionsByOptionValue = {};
    sortingFunctionsByOptionValue[optionValueSortByArea] = spriteFrameSortByAreaFn;
    sortingFunctionsByOptionValue[optionValueSortByPerimeter] = spriteFrameSortByPerimeterFn;
    sortingFunctionsByOptionValue[optionValueSortByWidth] = spriteFrameSortByWidthFn;
    sortingFunctionsByOptionValue[optionValueSortByHeight] = spriteFrameSortByHeightFn;

    const sortOption = userOptions[kUserOptionsSortByKey];
    const sortFunction = sortingFunctionsByOptionValue[sortOption];

    this.spriteFrameRefs.sort(sortFunction);
};

SpriteFrameCollection.prototype.removePointLayers = function() {
    selectLayersFromIDList(this.pointLayerIDs);
    deleteSelectedLayers();
};

// Writes packed coordinates to sprite frames
// Stores dimensions of the packed sprite sheet
SpriteFrameCollection.prototype.packFrames = function(userOptions) {
    const tree = new PackingTree(this.spriteFrameRefs, userOptions, this.totalPixelArea);
    const packingResult = tree.build();

    this.packedWidth = packingResult.w;
    this.packedHeight = packingResult.h;
    this.translationData = packingResult.translationData;
};

// Translates frames in the sprite sheet, to positions determined by the packing algorithm
SpriteFrameCollection.prototype.translateLayers = function() {
    const arr = this.translationData;
    const len = arr.length;
    for (var i = 0; i < len;) {
        translateLayerByID(arr[i++], arr[i++], arr[i++]);
    }

};

SpriteFrameCollection.prototype.createAtlasObject = function() {
    const atlasObject = {};
    const singleFrames = this.spriteFrames;
    const frameArrays = this.spriteFrameArrays;

    var len = singleFrames.length;
    for (var i = 0; i < len; ++i) {
        var frame = singleFrames[i];
        if (atlasObject[frame.name])
            throw "Duplicate name \"" + frame.name + "\". Atlas would be malformed!";
        atlasObject[frame.name] = new AtlasFrame(frame);
    }

    len = frameArrays.length;
    for (var j = 0; j < len; ++j) {
        var arr = frameArrays[j];
        var atlasArray = [];
        var fLen = arr.frames.length;
        for (var k = 0; k < fLen; ++k) {
            frame = arr.frames[k];
            atlasArray.push(new AtlasFrame(frame));
        }
        if (atlasObject[arr.name])
            throw "Duplicate name \"" + arr.name + "\". Atlas would be malformed!";
        atlasObject[arr.name] = atlasArray;
    }

    return atlasObject;
};