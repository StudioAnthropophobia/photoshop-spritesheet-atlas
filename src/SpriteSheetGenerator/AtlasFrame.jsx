// Constructor takes a SpriteFrame object as parameter.
// This will be the form of the frame elements in the final output atlas.
function AtlasFrame(spriteFrame) {
    this.x = spriteFrame.destPos.x;
    this.y = spriteFrame.destPos.y;
    this.w = spriteFrame.w;
    this.h = spriteFrame.h;
    this.ox = spriteFrame.offset.x;
    this.oy = spriteFrame.offset.y;
    this.points = spriteFrame.points;
}