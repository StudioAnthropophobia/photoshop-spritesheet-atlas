const tagRegex = /\[[AIMPR]\]\s/;
const arrayRegex = /\[[A]\]\s/;
const ignoreRegex = /\[[I]\]\s/;
const mergeRegex = /\[[M]\]\s/;
const pointRegex = /\[[P]\]\s/;
const relPosRegex = /\[[R]\]\s/;

function hasArrayTag(layerGroup) {
    const name = layerGroup.name;
    return name.match(arrayRegex) != null;
}

function hasIgnoreTag(layerObject) {
    const name = layerObject.name;
    return name.match(ignoreRegex) != null;
}

function hasMergeTag(layerGroup) {
    const name = layerGroup.name;
    return name.match(mergeRegex) != null;
}

function hasPointTag(artLayer) {
    const name = artLayer.name;
    return name.match(pointRegex) != null;
}

function hasRelPosTag(layerGroup) {
    const name = layerGroup.name;
    return name.match(relPosRegex) != null;
}

function nameWithoutTags(name) {
    const arr = name.split(tagRegex);
    return arr[1];
}