function composeDefaultFilePaths(srcDoc) {
    // Compose paths for output files
    const fileNameWithoutPath = srcDoc.fullName.displayName;
    const fileNameWithoutExtension = removeFileExtension(fileNameWithoutPath);
    const srcDocFolder = srcDoc.path;
    const outputFolderPath = srcDocFolder + "/" + fileNameWithoutExtension;
    const outputFileWithoutExtension = outputFolderPath + "/" + fileNameWithoutExtension;
    const outputJSONPath = outputFileWithoutExtension + ".json";
    const outputPNGPath = outputFileWithoutExtension + ".png";
    return {
        jsonPath: outputJSONPath,
        pngPath: outputPNGPath
    };
}

function removeFileExtension(fullFileName) {
    return fullFileName.substr(0, fullFileName.lastIndexOf(".")) || fullFileName;
}

function exportJSON(object, path) {
    const fileObject = new File(path);
    fileObject.parent.create();
    const str = JSON.stringify(object, null, 4);
    try {
        fileObject.open("w");
        fileObject.write(str);
        fileObject.close();
    } catch (e) {
        alert(e);
    }
}

function exportPNG(doc, path) {
    const fileObject = new File(path);
    fileObject.parent.create();
    const options = new PNGSaveOptions();
    doc.saveAs(fileObject, options);
}