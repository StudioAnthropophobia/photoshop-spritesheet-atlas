function TreeNode(_x, _y, _w, _h) {
    this.leftChild = null;
    this.rightChild = null;
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
    this.occupied = false;
}

function PackingOptions(pow2, sqr, padding, initialSize) {
    this.pow2 = pow2;
    this.sqr = sqr;
    this.padding = padding;
    this.initialSize = initialSize;
}

TreeNode.prototype.padding = 0;

TreeNode.prototype.splitHorizontally = function(spriteFrame) {
    this.leftChild = new TreeNode(this.x, this.y,
        spriteFrame.w + this.padding, this.h);

    this.rightChild = new TreeNode(
        this.x + spriteFrame.w + this.padding, this.y,
        this.w - spriteFrame.w - this.padding, this.h);
};

TreeNode.prototype.splitVertically = function(spriteFrame) {
    this.leftChild = new TreeNode(this.x, this.y,
        this.w, spriteFrame.h + this.padding);

    this.rightChild = new TreeNode(this.x,
        this.y + spriteFrame.h + this.padding,
        this.w, this.h - spriteFrame.h - this.padding);
};

TreeNode.prototype.insert = function(spriteFrame) {
    // Check whether this node is a leaf or not
    if (this.leftChild != null || this.rightChild != null) {
        // Node is not a leaf, try inserting into first child
        const newNode = this.leftChild.insert(spriteFrame);
        if (newNode != null) {
            return newNode;
        }

        // No room, try inserting into the second child instead
        return this.rightChild.insert(spriteFrame);
    } else {
        // Node is a leaf
        // Return null if occupied
        if (this.occupied) {
            return null;
        }

        // Return null if this node is too small
        if (spriteFrame.w + this.padding > this.w || spriteFrame.h + this.padding > this.h) {
            return null;
        }

        // Perfect fit, write position to layer data and return this node
        if (spriteFrame.w + this.padding === this.w && spriteFrame.h + this.padding === this.h) {
            this.occupied = true;
            spriteFrame.destPos.x = this.x;
            spriteFrame.destPos.y = this.y;
            spriteFrame.deltaX = this.x - spriteFrame.srcPos.x;
            spriteFrame.deltaY = this.y - spriteFrame.srcPos.y;
            return this;
        }

        // Otherwise, split node to create children
        // Decide whether to split horizontally or vertically
        const dw = this.w - spriteFrame.w;
        const dh = this.h - spriteFrame.h;

        if (dw > dh) {
            this.splitHorizontally(spriteFrame);
        } else {
            this.splitVertically(spriteFrame);
        }

        // Insert into the first child that was just created (will fit perfectly)
        return this.leftChild.insert(spriteFrame);
    }
};

function buildTreeWithSize(spriteFrames, w, h) {
    var root = new TreeNode(0, 0, w, h);
    // return root.recursiveInsert(spriteFrames);

    for (var i = 0; i < spriteFrames.length; i++) {
        var frame = spriteFrames[i];
        if (root.insert(frame) === null) {
            return null;
        }
    }
    return root;
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

// Interface /////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function buildPackingTree(spriteFrames, options) {
    var root = {};

    TreeNode.prototype.padding = options.padding;
    var initialD = options.initialSize;
    const pow2 = options.pow2;
    const sqr = options.sqr;

    // Grow canvas by 10% by default, if pow2 not set
    var growthFactor = 1.1;

    if (pow2) {
        growthFactor = 2;
        initialD = prevPowerOfTwo(initialD);
    }

    var w = initialD;
    var h = initialD;

    // Brute force iterations with growing canvas size, until all frames fit
    while ((root = buildTreeWithSize(spriteFrames, w, h)) === null) {
        // Could not fit, canvas needs to grow

        /*  If power-of-two is forced but not square,
            it is more conservative to grow dimensions separately:
            doubling both dimensions unnecessarily leads to wasted space. */
        if (pow2 && !sqr) {
            if (w > h)
                h *= growthFactor;
            else
                w *= growthFactor;
        } else
            w = h = Math.floor(growthFactor * w);


    }

    return root;
}