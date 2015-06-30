

module.exports = MeshParticleSystem;


var vec3 = BABYLON.Vector3;
var col3 = BABYLON.Color3;




/*
 *    particle data structure
*/

function ParticleData () {
  this.position = vec3.Zero()
  this.velocity = vec3.Zero()
  this.size = 1.0
  this.age = 0.0
  this.lifetime = 1.0 // seconds
}


/*
 *    Over-writeable user functions
*/

function initParticle(pdata) {
  pdata.position.copyFromFloats(0,0,0)
  pdata.velocity.x = 5 * (Math.random() - 0.5);
  pdata.velocity.y = 5 * (Math.random() * 0.5) + 2;
  pdata.velocity.z = 5 * (Math.random() - 0.5);
  pdata.size = 1*Math.random();
  pdata.age = 0;
  pdata.lifetime = 2;
}




/*
 *    system ctor
*/

function MeshParticleSystem(capacity, rate, texture, scene) {

  // public
  this.capacity = capacity;
  this.rate = rate;
  this.mesh = new BABYLON.Mesh('SPS-mesh', scene);
  this.material = new BABYLON.StandardMaterial("SPS-mat", scene);
  this.texture = texture;
  this.gravity = -1;
  this.disposeOnEmpty = false;
  this.stopOnEmpty = false;
  this.parent = null;

  // internal
  this._scene = scene;
  this._alive = 0;
  this._data = new Float32Array(capacity*9) // pos*3, vel*3, size, age, lifetime
  this._dummyParticle = new ParticleData()
  this._color0 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0)
  this._color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0)
  this._updateColors = true;
  this._size0 = 1.0;
  this._size1 = 1.0;
  this._positions = [];
  this._colors = [];
  this._playing = false;
  this._disposed = false;
  this._lastPos = vec3.Zero();

  // init mesh and vertex data
  var positions = this._positions;
  var colors = this._colors;
  var indices = [];
  var uvs = [];
  // quads : 2 triangles per particle
  for (var p = 0; p < capacity; p ++) {
    positions.push(0,0,0,  0,0,0,  0,0,0,  0,0,0);
    indices.push(p*4, p*4+1, p*4+2);
    indices.push(p*4, p*4+2, p*4+3);
    uvs.push(0,1, 1,1, 1,0, 0,0);
    colors.push( 1,0,1,1,  1,0,1,1,  1,0,1,1,  1,0,1,1 );
  }
  var vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uvs;
  vertexData.colors = colors;

  vertexData.applyToMesh(this.mesh, true);

  // init material
  this.mesh.material = this.material
  this.material.specularColor = col3.Black();

  // configurable functions
  this.initParticle = initParticle;

  // initialize mat/color/alpha settings
  updateColorSettings(this)

  // curried animate function
  var self = this;
  var lastTime = performance.now();
  this.curriedAnimate = function curriedAnimate() {
    var t = performance.now();    // ms
    var s = (t-lastTime) / 1000;  // sec
    self.animate(s);
    lastTime = t;
  }
}

var MPS = MeshParticleSystem;

/*
 *    
 *    API
 *    
*/


MPS.prototype.start = function startMPS() {
  if (this._playing) return;
  if (this._disposed) throw new Error('Already disposed');
  this._scene.registerBeforeRender( this.curriedAnimate );
  recalculateBounds(this);
  this._playing = true;
};

MPS.prototype.stop = function stopMPS() {
  if (!this._playing) return;
  this._scene.unregisterBeforeRender( this.curriedAnimate );
  this._playing = false;
};

MPS.prototype.setAlphaRange = function setAlphas(from, to) {
  this._color0.a = from;
  this._color1.a = to;
  updateColorSettings(this);
};

MPS.prototype.setColorRange = function setColors(from, to) {
  this._color0.r = from.r;
  this._color0.g = from.g;
  this._color0.b = from.b;
  this._color1.r = to.r;
  this._color1.g = to.g;
  this._color1.b = to.b;
  updateColorSettings(this);
};

MPS.prototype.setSizeRange = function setSizes(from, to) {
  this._size0 = from;
  this._size1 = to;
};

MPS.prototype.emit = function mpsEmit(count) {
  this.start();
  spawnParticles(this, count);
};

MPS.prototype.dispose = function mpsDispose() {
  disposeMPS(this);
};



/*
 *    
 *    Internals
 *    
*/


// set mesh/mat properties based on color/alpha parameters
function updateColorSettings(sys) {
  var c0 = sys._color0;
  var c1 = sys._color1;
  var doAlpha = !( equal(c0.a, 1) && equal(c0.a, c1.a) );
  var doColor = !( equal(c0.r, c1.r) && equal(c0.g, c1.g) && equal(c0.b, c1.b) );

  sys.mesh.hasVertexAlpha = doAlpha;
  if (doColor || doAlpha) {
    sys.material.ambientTexture = sys.texture;
    sys.material.opacityTexture = sys.texture;
    sys.material.diffuseTexture = null;
    sys.texture.hasAlpha = false;
    sys.material.useAlphaFromDiffuseTexture = true;
    sys.material.diffuseColor = col3.White();
  } else {
    sys.material.diffuseTexture = sys.texture;
    sys.material.ambientTexture = null;
    sys.material.opacityTexture = null;
    sys.texture.hasAlpha = true;
    sys.material.useAlphaFromDiffuseTexture = false;
    sys.material.diffuseColor = c0;
  }

  sys._updateColors = doAlpha || doColor;
}
function equal(a,b) {
  return (Math.abs(a-b) < 1e-5)
}


function recalculateBounds(system) {
  // toooootal hack.
  var reps = 30;
  var p = system._dummyParticle;
  system.initParticle(p);
  var t = 0,
      s = 0,
      max = p.velocity.clone(),
      min = p.velocity.clone();
  for (var i=0; i<reps; ++i) {
    system.initParticle(p);
    var v = p.velocity;
    max.x = Math.max( max.x, v.x );
    max.y = Math.max( max.y, v.y );
    max.z = Math.max( max.z, v.z );
    min.x = Math.min( min.x, v.x );
    min.y = Math.min( min.y, v.y );
    min.z = Math.min( min.z, v.z );
    t = Math.max( t, p.lifetime );
    s = Math.max( s, p.size );
  }
  // dist = v*t + 1/2*a*t^2
  min.scaleInPlace(t);
  max.scaleInPlace(t);
  max.y = Math.max( max.y, max.y + system.gravity*t*t/2 );
  min.y = Math.min( min.y, min.y + system.gravity*t*t/2 );
  min.subtractFromFloatsToRef( s,  s,  s, min);
  max.subtractFromFloatsToRef(-s, -s, -s, max);  // no addFromFloats, for some reason
  system.mesh._boundingInfo = new BABYLON.BoundingInfo(min, max);
}


function addNewParticle(sys) {
  // pass dummy data structure to user-definable init fcn
  var part = sys._dummyParticle
  sys.initParticle(part)
  // copy particle data into internal Float32Array
  var data = sys._data
  var ix = sys._alive * 9
  data[ix]   = part.position.x
  data[ix+1] = part.position.y
  data[ix+2] = part.position.z
  data[ix+3] = part.velocity.x
  data[ix+4] = part.velocity.y
  data[ix+5] = part.velocity.z
  data[ix+6] = part.size
  data[ix+7] = part.age
  data[ix+8] = part.lifetime
  sys._alive += 1
}

function removeParticle(sys, n) {
  // copy particle data from last live location to removed location
  var data = sys._data
  var from = (sys._alive-1) * 9
  var to = n * 9
  for (var i=0; i<9; ++i) {
    data[to+i] = data[from+i]
  }
  sys._alive -= 1;
}



/*
 *    animate all the particles!
*/

MPS.prototype.animate = function animateSPS(dt) {
  if (dt > 0.1) dt = 0.1;

  // adjust particles if mesh has moved
  adjustParticlesForMovement(this)
  
  // add/update/remove particles
  spawnParticles(this, this.rate * dt)
  updateAndRecycle(this, dt)

  // write new position/color data
  updatePositionsData(this)
  if (this._updateColors) updateColorsArray(this)

  // only draw active mesh positions
  this.mesh.subMeshes[0].indexCount = this._alive*6

  // possibly self-dispose if no active particles are left
  if (this._alive === 0) {
    if (this.disposeOnEmpty) this.dispose();
    else if (this.stopOnEmpty) this.stop();
  }
};


var pipe = 0
function spawnParticles(system, count) {
  pipe += count;
  var toAdd = Math.floor(pipe);
  pipe -= toAdd;
  var ct = system._alive + toAdd;
  if (ct > system.capacity) ct = system.capacity;
  while (system._alive < ct) {
    addNewParticle(system);
  }
}

function updateAndRecycle(system, dt) {
  // update particles and remove any that pass recycle check
  var alive = system._alive
  var grav = system.gravity * dt
  var data = system._data
  for (var i=0; i<system._alive; ++i) {
    var ix = i * 9
    data[ix+4] += grav                  // vel.y += g * dt
    data[ix]   += data[ix+3] * dt
    data[ix+1] += data[ix+4] * dt       // pos += vel * dt
    data[ix+2] += data[ix+5] * dt
    var t = data[ix+7] + dt             // t = age + dt
    if (t > data[ix+8]) {               // if (t>lifetime)..
      removeParticle(system, i)
      i--;
    } else {
      data[ix+7] = t;                   // age = dt
    }
  }
}


// if mesh system has moved since last frame, adjust particles to compensate

function adjustParticlesForMovement(system) {
  // relocate to parent if needed
  if (system.parent) {
    system.mesh.position.copyFrom( system.parent.absolutePosition )
  }
  var dx = system.mesh.position.x - system._lastPos.x;
  var dy = system.mesh.position.y - system._lastPos.y;
  var dz = system.mesh.position.z - system._lastPos.z;
  system._lastPos.copyFrom( system.mesh.position );
  if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < .001) return;
  
  console.log('adjusting', system._alive, 'particles')
  var alive = system._alive;
  var data = system._data;
  for (var i=0; i<alive; i++) {
    var di = i*9;
    data[di]   -= dx;
    data[di+1] -= dy;
    data[di+2] -= dz;
  }
}


function updatePositionsData(system) {
  var positions = system._positions;
  var data = system._data;
  var cam = system._scene.activeCamera;

  // prepare transform
  var mat = BABYLON.Matrix.Identity();
  BABYLON.Matrix.LookAtLHToRef(cam.globalPosition,      // eye
                               system.mesh.position,    // target
                               vec3.Up(), mat);
  mat.m[12] = mat.m[13] = mat.m[14] = 0;
  mat.invert();
  var m = mat.m

  var alive = system._alive;
  var quadDatArr = system._quadDatArr;
  var s0 = system._size0;
  var ds = system._size1 - s0;

  for (var i=0; i<alive; i++) {
    var di = i*9;
    var scale = data[di+7] / data[di+8];
    var size = data[di+6] * (s0 + ds*scale) / 2;

    var idx = i*12;
    for (var pt=0; pt<4; pt++) {

      var vx = (pt===1 || pt===2) ? size : -size;
      var vy = (pt>1) ? size : -size;
      
      // following is unrolled version of Vector3.TransformCoordinatesToRef
      // minus the bits zeroed out due to having no z coord
      
      var w = (vx * m[3]) + (vy * m[7]) + m[15];
      positions[idx]   = data[di]   + (vx * m[0] + vy * m[4])/w;
      positions[idx+1] = data[di+1] + (vx * m[1] + vy * m[5])/w;
      positions[idx+2] = data[di+2] + (vx * m[2] + vy * m[6])/w;

      idx += 3;
    }
  }

  system.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
}



function updateColorsArray(system) {
  var alive = system._alive;
  var data = system._data;
  var colors = system._colors;

  var r0 = system._color0.r;
  var g0 = system._color0.g;
  var b0 = system._color0.b;
  var a0 = system._color0.a;
  var dr = system._color1.r - r0;
  var dg = system._color1.g - g0;
  var db = system._color1.b - b0;
  var da = system._color1.a - a0;

  for (var i=0; i<alive; i++) {
    var di = i*9;

    var scale = data[di+7] / data[di+8];
    // scale alpha from startAlpha to endAlpha by (age/lifespan)
    var r = r0 + dr * scale;
    var g = g0 + dg * scale;
    var b = b0 + db * scale;
    var a = a0 + da * scale;

    var idx = i*16;
    for (var pt=0; pt<4; pt++) {
      colors[idx]   = r;
      colors[idx+1] = g;
      colors[idx+2] = b;
      colors[idx+3] = a;
      idx += 4;
    }
  }

  system.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors, false, false);
}



// dispose function

function disposeMPS(system) {
  system.stop();
  system.material.ambientTexture = null;
  system.material.opacityTexture = null;
  system.material.diffuseTexture = null;
  system.material.dispose();
  system.material = null;
  system.mesh.geometry.dispose();
  system.mesh.dispose();
  system.mesh = null;
  system.texture = null;
  system.curriedAnimate = null;
  system.initParticle = null;
  system._scene = null;
  system._dummyParticle = null;
  system._color0 = null;
  system._color1 = null;
  system._data = null;
  system._positions.length = 0;
  system._colors.length = 0;
  system._positions = null;
  system._colors = null;
  system.parent = null;
  system._disposed = true;
}



