function TreeNode(_x, _y, _w, _h) {
    this.leftChild = null;
    this.rightChild = null;
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
    this.occupied = false;
}

TreeNode.prototype.padding = 0;

TreeNode.prototype.splitHorizontally = function(layerData) {
    this.leftChild = new TreeNode(this.x, this.y,
        layerData.w + this.padding, this.h);

    this.rightChild = new TreeNode(
        this.x + layerData.w + this.padding, this.y,
        this.w - layerData.w - this.padding, this.h);
};

TreeNode.prototype.splitVertically = function(layerData) {
    this.leftChild = new TreeNode(this.x, this.y,
        this.w, layerData.h + this.padding);

    this.rightChild = new TreeNode(this.x,
        this.y + layerData.h + this.padding,
        this.w, this.h - layerData.h - this.padding);
};

TreeNode.prototype.insert = function(layerData) {
    // Check whether this node is a leaf or not
    if (this.leftChild != null || this.rightChild != null) {
        // Node is not a leaf, try inserting into first child
        const newNode = this.leftChild.insert(layerData);
        if (newNode != null) {
            return newNode;
        }

        // No room, try inserting into the second child instead
        return this.rightChild.insert(layerData);
    } else {
        // Node is a leaf
        // Return null if occupied
        if (this.occupied) {
            return null;
        }

        // Return null if this node is too small
        if (layerData.w + this.padding > this.w || layerData.h + this.padding > this.h) {
            return null;
        }

        // Perfect fit, write position to layer data and return this node
        if (layerData.w + this.padding === this.w && layerData.h + this.padding === this.h) {
            this.occupied = true;
            layerData.destPos.x = this.x;
            layerData.destPos.y = this.y;
            return this;
        }

        // Otherwise, split node to create children
        // Decide whether to split horizontally or vertically
        const dw = this.w - layerData.w;
        const dh = this.h - layerData.h;

        if (dw > dh) {
            this.splitHorizontally(layerData);
        } else {
            this.splitVertically(layerData);
        }

        // Insert into the first child that was just created (will fit perfectly)
        return this.leftChild.insert(layerData);
    }
};

TreeNode.prototype.recursiveInsert = function(sortedLayerDataArray) {
    for (var i = 0; i < sortedLayerDataArray.length; i++) {
        var data = sortedLayerDataArray[i];
        if (data.isArray) {
            if (this.recursiveInsert(data.layers) === null) {
                return null;
            }
        } else {
            if (this.insert(data) === null) {
                return null;
            }
        }
    }
    return this;
};

function buildTreeWithSize(srcLayerDataArray, w, h) {
    var root = new TreeNode(0, 0, w, h);
    return root.recursiveInsert(srcLayerDataArray);
}

function nextPowerOfTwo(num) {
    var i = 1;
    while (i < num) {
        i *= 2;
    }
    return i;
}

function getLargestDimension(layerDataArray) {
    var maxD = 0;
    for (var i = 0; i < layerDataArray.length; i++) {
        maxD = Math.max(layerDataArray[i].w, maxD);
        maxD = Math.max(layerDataArray[i].h, maxD);
    }
    return maxD;
}

function buildTree(srcLayerDataArray, pow2, square) {
    var root = {};
    const largestDim = getLargestDimension(srcLayerDataArray);
    const initialD = nextPowerOfTwo(largestDim);

    var w = initialD;
    var h = initialD;
    // Brute force iterations with growing canvas size, until all frames fit
    while ((root = buildTreeWithSize(srcLayerDataArray, w, h)) === null) {
        // Could not fit, canvas needs to grow
        if (pow2) {
            if (square) {
                w = h = w * 2;
            } else {
                w > h ? h *= 2 : w *= 2;
            }
        } else {
            if (square) {
                w = h = Math.floor(1.25 * w);
            } else {
                w > h ? h *= 2 : w *= 2;
            }
        }
    }
    return root;
}

function sortAndFlattenLayerData(layerDataArray, userOptions) {
    const sortedArray = [];
    // Flatten
    for (var i = 0; i < layerDataArray.length; i++) {
        var data = layerDataArray[i];

        if (data.isArray) {
            for (var j = 0; j < data.layers.length; j++) {
                sortedArray.push(data.layers[j]);
            }
        } else {
            sortedArray.push(data);
        }
    }

    // Decide sort function based on user options
    sortingFunctionsByOptionValue = {};
    sortingFunctionsByOptionValue[optionValueSortByArea] = layerDataSortByAreaFn;
    sortingFunctionsByOptionValue[optionValueSortByPerimeter] = layerDataSortByPerimeterFn;
    sortingFunctionsByOptionValue[optionValueSortByWidth] = layerDataSortByWidthFn;
    sortingFunctionsByOptionValue[optionValueSortByHeight] = layerDataSortByHeightFn;

    const sortOption = userOptions[kUserOptionsSortByKey];
    const sortFunction = sortingFunctionsByOptionValue[sortOption];

    sortedArray.sort(sortFunction);
    return sortedArray;
}

// Returns dimensions of the packed sprite sheet
function packLayers(layerDataArray, userOptions) {
    const pow2 = userOptions[kUserOptionsPowerOfTwoKey];
    const square = userOptions[kUserOptionsSquareKey];
    TreeNode.prototype.padding = userOptions[kUserOptionsPaddingKey];
    const sortedData = sortAndFlattenLayerData(layerDataArray, userOptions);
    const root = buildTree(sortedData, pow2, square);
    return {
        width: root.w,
        height: root.h
    };
}