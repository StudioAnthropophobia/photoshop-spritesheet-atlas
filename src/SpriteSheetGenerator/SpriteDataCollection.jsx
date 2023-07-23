// Top-level collection describing all sprite frames extracted from a document
function SpriteFrameCollection() {
    // Keep track of total pixel area, used in packing algorithm later
    this.totalArea = 0;

    // Store references to point layers for easy deletion later on
    this.pointLayerRefs = [];

    // Store references to ArtLayers for easy translation later on
    this.artLayerRefsByName = {};

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

    // Resulting sheet dimensions from packing algorithm
    this.packedWidth = 0;
    this.packedHeight = 0;
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
    this.totalArea += newFrame.getArea();
    // Store reference to layer for translation
    this.artLayerRefsByName[layer.name] = layer;
    // Store reference to new SpriteFrame in flat array
    this.spriteFrameRefs.push(newFrame);
    return newFrame;
};

// Add new array and set it to current context
SpriteFrameCollection.prototype.addFrameArrayFromGroup = function(group) {
    if (this.context.currentArray)
        throw ("Error at \"" + group.name + "\": Nested arrays are not supported. Check you document's layer structure.");

    const newArray = new SpriteFrameArray(nameWithoutTags(group.name));
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
    const newPoint = new Point2D(
        pointLayer.bounds[0].as("px") - parentSpriteFrame.srcPos.x,
        pointLayer.bounds[1].as("px") - parentSpriteFrame.srcPos.y);

    parentSpriteFrame.points[nameWithoutTags(pointLayer.name)] = newPoint;

    // Store reference to layer
    this.pointLayerRefs.push(pointLayer);
    return null;
};

SpriteFrameCollection.prototype.handleLayerObject = function(layerObject) {
    if (layerObject.typename === "LayerSet") {
        this.handleGroup(layerObject);
    } else if (layerObject.typename === "ArtLayer") {
        this.handleArtLayer(layerObject);
    } else {
        throw "Layer is of unknown type";
    }
};

SpriteFrameCollection.prototype.handleGroup = function(layerGroup) {
    if (hasRelPosTag(layerGroup)) {
        // Group marked with [R]
        this.handleRelPosGroup(layerGroup);
    } else if (hasArrayTag(layerGroup)) {
        // Group is marked with [A]
        this.handleArrayGroup(layerGroup);
    } else {
        // Group is just a plain group for organizing
        for (var i = 0; i < layerGroup.layers.length; i++) {
            this.handleLayerObject(layerGroup.layers[i]);
        }
    }
};

SpriteFrameCollection.prototype.handleRelPosGroup = function(layerGroup) {
    // Require the group to contain a single ArtLayer
    // Try to find it (can be at any index)
    var artLayersInThisGroup = 0;
    var newParentIndex = -1;

    for (var i = 0; i < layerGroup.layers.length; i++) {
        var layer = layerGroup.layers[i];
        if (layer.typename === "ArtLayer" && !hasPointTag(layer)) {
            artLayersInThisGroup++;
            newParentIndex = i;
        }
    }

    if (artLayersInThisGroup !== 1) {
        throw ("Group\"" + layerGroup.name + "\" needs to contain a single ArtLayer (or group marked with [M]). \
            Check the layer structure of your document!");
    }

    // Single parent layer was found, generate sprite frame
    const newParentArtLayer = layerGroup.layers[newParentIndex];
    const newParentSpriteFrame = this.handleArtLayer(newParentArtLayer);
    // Push new parent layer to context
    this.pushParentFrame(newParentSpriteFrame);
    // Handle children, skip the already handled ArtLayer
    for (i = 0; i < layerGroup.layers.length; i++) {
        if (i !== newParentIndex) {
            this.handleLayerObject(layerGroup.layers[i]);
        }
    }
    // Pop parent from context after all done
    this.popParentFrame();
};

SpriteFrameCollection.prototype.handleArrayGroup = function(layerGroup) {
    // Push new array to collection
    const newArray = this.addFrameArrayFromGroup(layerGroup);
    // Update context
    this.enterArray(newArray);
    // Handle children
    for (var i = 0; i < layerGroup.layers.length; i++) {
        this.handleLayerObject(layerGroup.layers[i]);
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
    const layers = srcDoc.layers;

    for (var i = 0; i < layers.length; i++) {
        if (!layers[i].isBackgroundLayer) {
            this.handleLayerObject(layers[i]);
        }
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
    for (var i = 0; i < this.pointLayerRefs.length; i++) {
        this.pointLayerRefs[i].remove();
    }
};

// Writes packed coordinates to sprite frames
// Stores dimensions of the packed sprite sheet
SpriteFrameCollection.prototype.packFrames = function(userOptions) {
    const initialSize = Math.ceil(Math.sqrt(this.totalArea));
    const pow2 = userOptions[kUserOptionsPowerOfTwoKey];
    const padding = userOptions[kUserOptionsPaddingKey];
    const sqr = userOptions[kUserOptionsSquareKey];

    const packingOptions = new PackingOptions(pow2, sqr, padding, initialSize);

    const root = buildPackingTree(this.spriteFrameRefs, packingOptions);

    this.packedWidth = root.w;
    this.packedHeight = root.h;
};

// Translates frames in the sprite sheet, to positions determined by the packing algorithm
// (Slowest function in the script so far)
SpriteFrameCollection.prototype.translateLayers = function() {
    const frames = this.spriteFrameRefs;
    for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        translateLayerByName(frame.name, frame.deltaX, frame.deltaY);
    }
};

SpriteFrameCollection.prototype.createAtlasObject = function() {
    const atlasObject = {};
    const singleFrames = this.spriteFrames;
    const frameArrays = this.spriteFrameArrays;

    for (var i = 0; i < singleFrames.length; i++) {
        var frame = singleFrames[i];
        atlasObject[frame.name] = new AtlasFrame(frame);
    }

    for (var j = 0; j < frameArrays.length; j++) {
        var arr = frameArrays[j];
        var atlasArray = [];
        for (var k = 0; k < arr.frames.length; k++) {
            frame = arr.frames[k];
            atlasArray.push(new AtlasFrame(frame));
        }
        atlasObject[arr.name] = atlasArray;
    }

    return atlasObject;
};