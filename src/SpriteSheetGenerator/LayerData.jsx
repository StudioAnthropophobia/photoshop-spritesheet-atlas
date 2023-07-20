function Point2D(x, y) {
    this.x = x;
    this.y = y;
}

function LayerDataElement(layer, parentLayerData) {
    this.isArray = false;
    this.srcPos = new Point2D(layer.bounds[0].as("px"), layer.bounds[1].as("px"));
    this.destPos = new Point2D(0, 0);
    this.offset = new Point2D(0, 0);
    this.w = layer.bounds[2].as("px") - this.srcPos.x;
    this.h = layer.bounds[3].as("px") - this.srcPos.y;
    this.name = layer.name;
    this.points = {};

    if (parentLayerData) {
        this.offset.x = this.srcPos.x - parentLayerData.srcPos.x;
        this.offset.y = this.srcPos.y - parentLayerData.srcPos.y;
    }
}

LayerDataElement.prototype.getPerimeter = function() {
    return 2 * this.w + 2 * this.h;
};

LayerDataElement.prototype.getArea = function() {
    return this.w * this.h;
};

function LayerDataElementArray(name, layerDataElementArray) {
    this.isArray = true;
    this.name = name;
    this.layers = layerDataElementArray;
}

function layerDataSortByPerimeterFn(a, b) {
    const ap = a.getPerimeter();
    const bp = b.getPerimeter();
    if (ap === bp) {
        return 0;
    } else if (ap < bp) {
        return 1;
    } else {
        return -1;
    }
}

function layerDataSortByAreaFn(a, b) {
    const aArea = a.w * a.h;
    const bArea = b.w * b.h;
    if (aArea === bArea) return 0;
    else if (aArea < bArea) return 1;
    else return -1;
}

function layerDataSortByWidthFn(a, b) {
    if (a.w === b.w) return 0;
    else if (a.w < b.w) return 1;
    else return -1;
}

function layerDataSortByHeightFn(a, b) {
    if (a.h === b.h) return 0;
    else if (a.h < b.h) return 1;
    else return -1;
}


function handleGroup(layerGroup, layerDataArray, parentLayerData) {
    // Check if group is tagged for relative positioning
    if (hasRelPosTag(layerGroup)) {
        // Group is a parent layer with relatively positioned children
        // Therefore require a single, parent ArtLayer
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

        // Single parent layer was found
        const newParentArtLayer = layerGroup.layers[newParentIndex];
        const newParentLayerData = handleArtLayer(newParentArtLayer, layerDataArray, parentLayerData);

        // Handle children, pass main layer data as parent
        for (i = 0; i < layerGroup.layers.length; i++) {
            // Skip the main ArtLayer, as it was already handled
            if (i !== newParentIndex) {
                handleLayerObject(layerGroup.layers[i], layerDataArray, newParentLayerData);
            }
        }
    } else if (hasArrayTag(layerGroup)) {
        const name = nameWithoutTags(layerGroup.name);
        const newLayerDataArray = [];
        for (i = 0; i < layerGroup.layers.length; i++) {
            // Nested arrays are disallowed
            if (hasArrayTag(layerGroup.layers[i])) {
                throw ("Error at array \"" + layerGroup.name + "\": Nested arrays are not allowed.");
            }
            handleLayerObject(layerGroup.layers[i], newLayerDataArray, parentLayerData);
        }
        const newData = new LayerDataElementArray(name, newLayerDataArray);
        layerDataArray.push(newData);
    } else {
        // Group is just a plain group for organizing
        for (i = 0; i < layerGroup.layers.length; i++) {
            handleLayerObject(layerGroup.layers[i], layerDataArray, parentLayerData);
        }
    }
}

function handleArtLayer(layer, layerDataArray, parentLayerData) {
    if (hasPointTag(layer)) {
        handlePointLayer(layer, parentLayerData);
    } else {
        const newLayerData = new LayerDataElement(layer, parentLayerData);
        layerDataArray.push(newLayerData);
        return newLayerData;
    }
}

function handlePointLayer(artLayer, parentLayerData) {
    if (!parentLayerData) {
        throw ("Point layer has no parent; \
        check the layer structure of your document!");
    }

    const newPoint = new Point2D(
        artLayer.bounds[0].as("px") - parentLayerData.srcPos.x,
        artLayer.bounds[1].as("px") - parentLayerData.srcPos.y);

    parentLayerData.points[nameWithoutTags(artLayer.name)] = newPoint;
}

function handleLayerObject(layerObject, layerDataArray, parentLayerData) {

    if (layerObject.typename === "LayerSet") {
        handleGroup(layerObject, layerDataArray, parentLayerData);
    } else if (layerObject.typename === "ArtLayer") {
        handleArtLayer(layerObject, layerDataArray, parentLayerData);
    } else {
        throw "Layer is of unknown type";
    }
}

function buildLayerData(layers) {
    var layerDataArray = [];

    for (var i = 0; i < layers.length; i++) {
        if (!layers[i].isBackgroundLayer) {
            handleLayerObject(layers[i], layerDataArray);
        }
    }
    return layerDataArray;
}