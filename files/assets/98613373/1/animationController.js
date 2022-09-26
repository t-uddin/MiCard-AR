var AnimationController = pc.createScript('animationController');


// set up an entity reference for the player entity
AnimationController.attributes.add('playerEntity', { type: 'entity' });


// initialize code called once per entity
AnimationController.prototype.playIdle = function(e) {
    console.log("idle triggered");
    this.entity.anim.setTrigger("idle");
};


AnimationController.prototype.playWave = function(e) {
    console.log("wave triggered");
};


AnimationController.prototype.playThink = function(e) {
    console.log("think triggered");
    this.entity.anim.setTrigger("think");
};


AnimationController.prototype.playTalk = function(e) {
    console.log("talk triggered");
    this.entity.anim.setTrigger("talk");
};


AnimationController.prototype.playListen = function(e) {
    console.log("listen triggered");
    this.entity.anim.setTrigger("listen");
};

