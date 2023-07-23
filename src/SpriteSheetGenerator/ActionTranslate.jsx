// Based on actions recorded with ScriptListener

const idslct = charIDToTypeID("slct");
const idnull = charIDToTypeID("null");
const idLyr = charIDToTypeID("Lyr ");
const idMkVs = charIDToTypeID("MkVs");
const idHrzn = charIDToTypeID("Hrzn");
const idPxl = charIDToTypeID("#Pxl");
const idVrtc = charIDToTypeID("Vrtc");
const idTrnf = charIDToTypeID("Trnf");
const idOrdn = charIDToTypeID("Ordn");
const idTrgt = charIDToTypeID("Trgt");
const idOfst = charIDToTypeID("Ofst");
const idFTcs = charIDToTypeID("FTcs");
const idQCSt = charIDToTypeID("QCSt");
const idQcsa = charIDToTypeID("Qcsa");
const idLnkd = charIDToTypeID("Lnkd");
const idIntr = charIDToTypeID("Intr");
const idIntp = charIDToTypeID("Intp");
const idNrst = charIDToTypeID("Nrst");

const refLayerSelect = (function() {
    const r = new ActionReference();
    r.putEnumerated(idLyr, idOrdn, idTrgt);
    return r;
})();

const descTrnf = (function() {
    const desc = new ActionDescriptor();
    desc.putReference(idnull, refLayerSelect);
    desc.putEnumerated(idFTcs, idQCSt, idQcsa);
    desc.putBoolean(idLnkd, true);
    desc.putEnumerated(idIntr, idIntp, idNrst);
    return desc;
})();

function getActionDescriptorWithOffsetCoordinates(x, y) {
    var desc52 = new ActionDescriptor();
    desc52.putUnitDouble(idHrzn, idPxl, x);
    desc52.putUnitDouble(idVrtc, idPxl, y);
    return desc52;
}

function selectLayerByName(layerName) {
    var desc54 = new ActionDescriptor();
    var ref8 = new ActionReference();
    ref8.putName(idLyr, layerName);
    desc54.putReference(idnull, ref8);
    desc54.putBoolean(idMkVs, false);
    executeAction(idslct, desc54, DialogModes.NO);
}

function translateSelectedLayer(x, y) {
    const trafoDesc = descTrnf;

    const coordsDesc = getActionDescriptorWithOffsetCoordinates(x, y);
    trafoDesc.putObject(idOfst, idOfst, coordsDesc);

    executeAction(idTrnf, trafoDesc, DialogModes.NO);
}

///////////////////////////////////////////////////////////////////////////////
// Interface //////////////////////////////////////////////////////////////////

function translateLayerByName(name, x, y) {
    selectLayerByName(name);
    translateSelectedLayer(x, y);

}