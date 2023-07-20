function PrunedLayerData(layerData) {
    this.x = layerData.destPos.x;
    this.y = layerData.destPos.y;
    this.w = layerData.w;
    this.h = layerData.h;
    this.ox = layerData.offset.x;
    this.oy = layerData.offset.y;
    this.points = layerData.points;
}

// Returns an object that can be directly stringified and written to a .json file
function pruneLayerData(layerDataArray) {
    var prunedData = {};

    for (var i = 0; i < layerDataArray.length; i++) {
        var data = layerDataArray[i];
        if (data.isArray) {
            prunedData[data.name] = [];
            for (var j = 0; j < data.layers.length; j++) {
                prunedData[data.name].push(new PrunedLayerData(data.layers[j]));
            }
        } else {
            prunedData[data.name] = new PrunedLayerData(data);
        }
    }

    return prunedData;
}