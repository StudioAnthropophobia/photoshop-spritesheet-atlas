function PackingTree(spriteFrames, userOptions, totalPixelArea) {
    // Store reference to input data
    this.spriteFrames = spriteFrames;

    // Options
    this.padding = userOptions[kUserOptionsPaddingKey];
    this.pow2 = userOptions[kUserOptionsPowerOfTwoKey];
    this.sqr = userOptions[kUserOptionsSquareKey];
    this.initialSize = Math.ceil(Math.sqrt(totalPixelArea));

    // Set growth parameters depending on pow2
    this.growthFactor = this.pow2 ? 2.0 : 1.1;
    this.initialSize = this.pow2 ?
        prevPowerOfTwo(this.initialSize) :
        this.initialSize;

    // Output
    this.rootNode = null;
    this.outputTranslationData = [];

    // Set reference for nodes to to record output data 
    PackingTreeNode.prototype.refToTranslationData = this.outputTranslationData;
}

function nextPowerOfTwo(num) {
    var i = 1;
    while (i < num) {
        i *= 2;
    }
    return i;
}

function prevPowerOfTwo(num) {
    var i = 1;
    var prev = 1;
    while (i < num) {
        prev = i;
        i *= 2;
    }
    return prev;
}

PackingTree.prototype.tryBuildWithSize = function(w, h) {
    // Clear output and root node
    // PackingTreeNode prototype holds reference to translationData ->
    // Set length to 0 instead of assigning []
    this.outputTranslationData.length = 0;
    this.rootNode = new PackingTreeNode(0, 0, w, h);

    const len = this.spriteFrames.length;
    for (var i = 0; i < len; ++i) {
        var frame = this.spriteFrames[i];
        if (this.rootNode.insert(frame, this.padding) === null) {
            return null;
        }
    }
    return this.rootNode;
};

// Interface /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

PackingTree.prototype.build = function() {
    var w = this.initialSize;
    var h = this.initialSize;

    // Brute force iterations with growing canvas size, until all frames fit
    while ((this.tryBuildWithSize(w, h)) === null) {
        // Could not fit, canvas needs to grow

        /*  If power-of-two is forced but not square,
            it is more conservative to grow dimensions separately:
            doubling both dimensions unnecessarily leads to wasted space. */
        if (this.pow2 && !this.sqr) {
            if (w > h)
                h *= this.growthFactor;
            else
                w *= this.growthFactor;
        } else
            w = h = Math.floor(this.growthFactor * w);
    }

    return {
        w: this.rootNode.w,
        h: this.rootNode.h,
        translationData: this.outputTranslationData
    };
};