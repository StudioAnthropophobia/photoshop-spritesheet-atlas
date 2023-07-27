function PackingTreeNode(_x, _y, _w, _h) {
    this.leftChild = null;
    this.rightChild = null;
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
    this.occupied = false;
}

PackingTreeNode.prototype.refToTranslationData = null;

PackingTreeNode.prototype.splitHorizontally = function(spriteFrame, padding) {
    this.leftChild = new PackingTreeNode(this.x, this.y,
        spriteFrame.w + padding, this.h);

    this.rightChild = new PackingTreeNode(
        this.x + spriteFrame.w + padding, this.y,
        this.w - spriteFrame.w - padding, this.h);
};

PackingTreeNode.prototype.splitVertically = function(spriteFrame, padding) {
    this.leftChild = new PackingTreeNode(this.x, this.y,
        this.w, spriteFrame.h + padding);

    this.rightChild = new PackingTreeNode(this.x,
        this.y + spriteFrame.h + padding,
        this.w, this.h - spriteFrame.h - padding);
};

PackingTreeNode.prototype.insert = function(spriteFrame, padding) {
    // Check whether this node is a leaf or not
    if (this.leftChild != null || this.rightChild != null) {
        // Node is not a leaf, try inserting into first child
        const newNode = this.leftChild.insert(spriteFrame, padding);
        if (newNode != null) {
            return newNode;
        }

        // No room, try inserting into the second child instead
        return this.rightChild.insert(spriteFrame, padding);
    } else {
        // Node is a leaf
        // Return null if occupied
        if (this.occupied) {
            return null;
        }

        // Return null if this node is too small
        if (spriteFrame.w + padding > this.w || spriteFrame.h + padding > this.h) {
            return null;
        }

        // Perfect fit, write position to layer data and return this node
        if (spriteFrame.w + padding === this.w && spriteFrame.h + padding === this.h) {
            this.occupied = true;

            spriteFrame.destPos.x = this.x;
            spriteFrame.destPos.y = this.y;

            // Translation uses deltaX and deltaY instead of target position
            this.refToTranslationData.push(spriteFrame.layerID,
                this.x - spriteFrame.srcPos.x,
                this.y - spriteFrame.srcPos.y);

            return this;
        }

        // Otherwise, split node to create children
        // Decide whether to split horizontally or vertically
        const dw = this.w - spriteFrame.w;
        const dh = this.h - spriteFrame.h;

        if (dw > dh) {
            this.splitHorizontally(spriteFrame, padding);
        } else {
            this.splitVertically(spriteFrame, padding);
        }

        // Insert into the first child that was just created (will fit perfectly)
        return this.leftChild.insert(spriteFrame, padding);
    }
};