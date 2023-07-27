// Based on actions recorded with ScriptListener

const TID = {
    Mrg2: charIDToTypeID("Mrg2"),
    Lyr: charIDToTypeID("Lyr "),
    LyrI: charIDToTypeID("LyrI"),
    Ordn: charIDToTypeID("Ordn"),
    Trgt: charIDToTypeID("Trgt"),
    Dlt: charIDToTypeID("Dlt "),
    slct: charIDToTypeID("slct"),
    Null: charIDToTypeID("null"),
    MkVs: charIDToTypeID("MkVs"),
    Hrzn: charIDToTypeID("Hrzn"),
    Vrtc: charIDToTypeID("Vrtc"),
    Ofst: charIDToTypeID("Ofst"),
    Fl: charIDToTypeID("Fl  "),
    FlMd: charIDToTypeID("FlMd"),
    Bckg: charIDToTypeID("Bckg"),
    selectNoLayers: stringIDToTypeID("selectNoLayers")
};

function selectLayerByID(layerID) {
    var ref = new ActionReference();
    var desc = new ActionDescriptor();
    ref.putIdentifier(TID.Lyr, layerID);
    desc.putReference(TID.Null, ref);
    desc.putBoolean(TID.MkVs, false);
    executeAction(TID.slct, desc, DialogModes.NO);
}

function deselectAllLayers() {
    var desc = new ActionDescriptor();
    var aRef = new ActionReference();
    aRef.putEnumerated(TID.Lyr, TID.Ordn, TID.Trgt);
    desc.putReference(TID.Null, aRef);
    executeAction(TID.selectNoLayers, desc, DialogModes.NO);
}

function selectLayersFromIDList(arrayOfIDs) {

    deselectAllLayers();

    if (!arrayOfIDs.length) return;

    var desc = new ActionDescriptor();
    var aRef = new ActionReference();
    const len = arrayOfIDs.length;
    for (var i = 0; i < len; ++i) {
        aRef.putIdentifier(TID.Lyr, arrayOfIDs[i]);
    }

    desc.putReference(TID.Null, aRef);
    desc.putBoolean(TID.MkVs, false);
    executeAction(TID.slct, desc, DialogModes.NO);
}

function offsetSelectedLayer(x, y) {
    var desc = new ActionDescriptor();

    desc.putInteger(TID.Hrzn, x);
    desc.putInteger(TID.Vrtc, y);
    desc.putEnumerated(TID.Fl, TID.FlMd, TID.Bckg);

    executeAction(TID.Ofst, desc, DialogModes.NO);
}

function mergeSelectedLayers() {
    executeAction(TID.Mrg2, undefined, DialogModes.NO);
}


function mergeGroupByID(groupID) {
    selectLayerByID(groupID);
    mergeSelectedLayers();
}

function translateLayerByID(layerID, x, y) {
    selectLayerByID(layerID);
    offsetSelectedLayer(x, y);
}

function deleteSelectedLayers() {
    var desc = new ActionDescriptor();
    var aRef = new ActionReference();
    aRef.putEnumerated(TID.Lyr, TID.Ordn, TID.Trgt);
    desc.putReference(TID.Null, aRef);
    try {
        executeAction(TID.Dlt, desc, DialogModes.NO);
    } catch (e) {}
}