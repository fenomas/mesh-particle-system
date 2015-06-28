mesh-particle-system
==========

Particle system for Babylon.js that composites like a standard mesh

### Usage:

```javascript
var MPS = require('mesh-particle-system');

var tex = new BABYLON.Texture('particle.png', scene);
var capacity = 200;
var rate = 30;           // particles/second
var mps = new MPS(capacity, rate, tex, scene);
```

Live demo [here](http://andyhall.github.io/mesh-particle-system/example/).

### Installation

```shell
npm install mesh-particle-system
```

To run demo locally:

```shell
cd mesh-particle-system
npm install
npm test
```

### API

```javascript
// particle system settings
mps.gravity = -5; // y direction only for now
mps.rate = 50; // particles/second

// define ranges that particles go through in their lifetime
mps.setAlphaRange( 1, 0 );
mps.setColorRange( BABYLON.Color3.Red(), BABYLON.Color3.Green() );
mps.setSizeRange( 1, 0.5 );

// move system around by accessing its mesh
mps.mesh.position.y = 2;

// define a custom particle init function to set 
mps.initParticle = function myInitParticle(pdata) {
  pdata.position.copyFromFloats( /* ... */ );
  pdata.velocity.copyFromFloats( /* ... */ );
  pdata.size = Math.random();
  pdata.age = 0;
  pdata.lifetime = Math.random() + 1;
}

// start/stop
mps.start();
mps.stop();
```