mesh-particle-system
==========

Particle system for Babylon.js that composites like a standard mesh

### Usage:

```javascript
var MPS = require('mesh-particle-system');

var tex = new BABYLON.Texture('particle.png', scene);
var capacity = 200;
var rate = 30;           // particles/second
var mps = new MPS(capacity, rate, scene);
mps.setTexture(tex);
```

Live demo [here](https://andyhall.github.io/mesh-particle-system/).

### Installation

```shell
npm install mesh-particle-system
```

To run demo locally (with `webpack-dev-server`):

```shell
cd mesh-particle-system
npm install
npm test
```

### API

```javascript
// constructor optionally takes a starting color and vertex UV ranges for each particle
var startColor = BABYLON.Color3.White();
var uRange = [0, 1];
var vRange = [0, 1];
var mps = new MPS(capacity, rate, scene, startColor, uRange, vRange);

// if no material is passed in one will be created (and later disposed) internally
mps.setTexture(myTexture, myMaterial);

// particle system settings
mps.gravity = -5; // y direction only for now
mps.rate = 50; // particles/second
mps.friction = 0.99; // velocity *= friction each frame

// define ranges that particles go through in their lifetime
mps.setAlphaRange( 1, 0 );
mps.setColorRange( BABYLON.Color3.Red(), BABYLON.Color3.Green() );
mps.setSizeRange( 1, 0.5 );

// set the mesh's initial position by directly accessing it
mps.mesh.position.y = 2;

// later on, move the mesh by repositioning it
// this offsets each particle so they keep a consistent world position
mps.setMeshPosition(0, 3, 0);

// define a custom particle init function to set 
mps.initParticle = function myInitParticle(pdata) {
  pdata.position.copyFromFloats( /* ... */ );
  pdata.velocity.copyFromFloats( /* ... */ );
  pdata.size = Math.random();
  pdata.age = 0;
  pdata.lifetime = Math.random() + 1;
}

// other stuff
mps.start();
mps.stop();
mps.emit(20); // particles get emitted the following frame
mps.dispose();
mps.onDispose; // default null
mps.stopOnEmpty // default false
mps.disposeOnEmpty // default false
```

### Recent changes

 * 0.10.0
   * Adds `setMeshPosition`, removes default behavior of 
     watching mesh position and rebasing automatically
   * Removes `parent` parameter and behavior
 * 0.9.0
   * Adds `startColor` parameter to constructor
 * 0.8.0
   * Performance fix
 * 0.7.0
   * Texture is now set via method rather than being passed in to constructor
   * Constructor now takes UV ranges, which are baked into particle vertices

