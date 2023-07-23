function Point2D(x, y) {
    this.x = x;
    this.y = y;
}

// Single frame element constructed from an ArtLayer
function SpriteFrame(layer, parentSpriteFrame) {
    this.srcPos = new Point2D(layer.bounds[0].as("px"), layer.bounds[1].as("px"));
    this.destPos = new Point2D(0, 0);
    this.offset = new Point2D(0, 0);
    this.w = layer.bounds[2].as("px") - this.srcPos.x;
    this.h = layer.bounds[3].as("px") - this.srcPos.y;
    this.name = layer.name;
    this.points = {};
    if (parentSpriteFrame) {
        this.offset.x = this.srcPos.x - parentSpriteFrame.srcPos.x;
        this.offset.y = this.srcPos.y - parentSpriteFrame.srcPos.y;
    }
}

// Wraps an array of SpriteFrame objects.
// Corresponds to groups tagged with [A] in the document
function SpriteFrameArray(name) {
    this.name = name;
    this.frames = [];
}

SpriteFrameArray.prototype.addFrame = function(newFrame) {
    this.frames.push(newFrame);
};

SpriteFrame.prototype.getPerimeter = function() {
    return 2 * this.w + 2 * this.h;
};

SpriteFrame.prototype.getArea = function() {
    return this.w * this.h;
};

// Sort functions for elements
function spriteFrameSortByPerimeterFn(a, b) {
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

function spriteFrameSortByAreaFn(a, b) {
    const aArea = a.w * a.h;
    const bArea = b.w * b.h;
    if (aArea === bArea) return 0;
    else if (aArea < bArea) return 1;
    else return -1;
}

function spriteFrameSortByWidthFn(a, b) {
    if (a.w === b.w) return 0;
    else if (a.w < b.w) return 1;
    else return -1;
}

function spriteFrameSortByHeightFn(a, b) {
    if (a.h === b.h) return 0;
    else if (a.h < b.h) return 1;
    else return -1;
}