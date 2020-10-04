'use strict'
/* global BABYLON */

module.exports = MeshParticleSystem


var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3




/*
 *    particle data structure
*/

function ParticleData() {
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
    pdata.position.copyFromFloats(0, 0, 0)
    pdata.velocity.x = 5 * (Math.random() - 0.5)
    pdata.velocity.y = 5 * (Math.random() * 0.5) + 2
    pdata.velocity.z = 5 * (Math.random() - 0.5)
    pdata.size = 1 * Math.random()
    pdata.age = 0
    pdata.lifetime = 2
}




/*
 *    system ctor
*/

function MeshParticleSystem(capacity, rate, scene, startColor, uRange, vRange) {

    // defaults
    if (!capacity) capacity = 100
    if (isNaN(rate)) rate = 0
    if (!scene) throw 'Invalid scene passed to mesh-particle-system'
    startColor = startColor || { r: +1, g: +1, b: +1, a: +1 }
    uRange = uRange || [+0, +1]
    vRange = vRange || [+0, +1]

    // public
    this.capacity = capacity
    this.rate = rate
    this.mesh = new BABYLON.Mesh('MPS-mesh', scene)
    this.material = null
    this.texture = null
    this.gravity = -1
    this.friction = 1
    this.fps = 60
    this.disposeOnEmpty = false
    this.stopOnEmpty = false
    this.onDispose = null
    this.onParticleUpdate = function () { }

    // internal
    this._scene = scene
    this._alive = 0
    this._data = new Float32Array(capacity * NUM_PARAMS) // pos*3, vel*3, size, age, lifetime
    this._dummyParticle = new ParticleData()
    this._color0 = new BABYLON.Color4(startColor.r, startColor.g, startColor.b, startColor.a)
    this._color1 = new BABYLON.Color4(startColor.r, startColor.g, startColor.b, startColor.a)
    this._updateColors = false
    this._size0 = 1.0
    this._size1 = 1.0
    this._positions = []
    this._colors = []
    this._playing = false
    this._disposed = false
    this._lastPos = vec3.Zero()
    this._startingThisFrame = false
    this._toEmit = 0
    this._createdOwnMaterial = false
    this._needsColorUpdate = true

    // init mesh and vertex data
    var positions = this._positions
    var colors = this._colors
    var indices = []
    var uvs = []
    var baseUVs = [
        uRange[0], vRange[1],
        uRange[1], vRange[1],
        uRange[1], vRange[0],
        uRange[0], vRange[0]
    ]
    // quads : 2 triangles per particle
    for (var p = 0; p < capacity; p++) {
        positions.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        indices.push(p * 4, p * 4 + 1, p * 4 + 2)
        indices.push(p * 4, p * 4 + 2, p * 4 + 3)
        // uvs.push(0, 1, 1, 1, 1, 0, 0, 0)
        for (var j = 0; j < 8; j++) uvs.push(baseUVs[j])
        for (var k = 0; k < 4; k++) {
            colors.push(startColor.r, startColor.g, startColor.b, startColor.a)
        }
    }
    var vertexData = new BABYLON.VertexData()
    vertexData.positions = positions
    vertexData.indices = indices
    vertexData.uvs = uvs
    vertexData.colors = colors

    vertexData.applyToMesh(this.mesh, true)

    // configurable functions
    this.initParticle = initParticle

    // curried animate function
    var self = this
    this.curriedAnimate = function curriedAnimate() {
        self.animate(1 / self.fps)
    }

    // debugging..
    // this.mesh.showBoundingBox = true
}

var MPS = MeshParticleSystem




/*
 *    
 *    API
 *    
*/


MPS.prototype.start = function startMPS() {
    if (this._playing) return
    if (this._disposed) throw new Error('Already disposed')
    this._scene.registerBeforeRender(this.curriedAnimate)
    recalculateBounds(this)
    this._playing = true
    this._startingThisFrame = true
}

MPS.prototype.stop = function stopMPS() {
    if (!this._playing) return
    this._scene.unregisterBeforeRender(this.curriedAnimate)
    this._playing = false
}

MPS.prototype.setTexture = function setTexture(texture, material) {
    if (material) {
        // material is optional - if handed in, store and use
        if (this.material && this._createdOwnMaterial) {
            this.material.dispose(false, false)
        }
        this.material = material
        this._createdOwnMaterial = false
    } else if (!this.material) {
        // no material handed in - create if needed
        this.material = new BABYLON.StandardMaterial("MPS-mat", this._scene)
        this.material.specularColor = col3.Black()
        this.material.checkReadyOnlyOnce = true
        this._createdOwnMaterial = true
    }
    // apply texture to material
    this.mesh.material = this.material
    this.texture = texture
    this._needsColorUpdate = true
}

MPS.prototype.setAlphaRange = function setAlphas(from, to) {
    this._color0.a = from
    this._color1.a = to
    this._needsColorUpdate = true
}

MPS.prototype.setColorRange = function setColors(from, to) {
    this._color0.r = from.r
    this._color0.g = from.g
    this._color0.b = from.b
    this._color1.r = to.r
    this._color1.g = to.g
    this._color1.b = to.b
    this._needsColorUpdate = true
}

MPS.prototype.setSizeRange = function setSizes(from, to) {
    this._size0 = from
    this._size1 = to
}

MPS.prototype.setMeshPosition = function (x, y, z) {
    var dx = x - this.mesh.position.x
    var dy = y - this.mesh.position.y
    var dz = z - this.mesh.position.z
    rebaseParticlePositions(this, dx, dy, dz)
    this.mesh.position.copyFromFloats(x, y, z)
}

MPS.prototype.emit = function mpsEmit(count) {
    this.start()
    this._toEmit += count
}

MPS.prototype.dispose = function mpsDispose() {
    if (this.onDispose) this.onDispose()
    disposeMPS(this)
}



/*
 *    
 *    Internals
 *    
*/

var NUM_PARAMS = 9    // stored floats per particle


// set mesh/mat properties based on color/alpha parameters
function updateColorSettings(sys) {
    sys._needsColorUpdate = false
    var c0 = sys._color0
    var c1 = sys._color1
    var doAlpha = !(equal(c0.a, 1) && equal(c0.a, c1.a))
    var doColor = !(equal(c0.r, c1.r) && equal(c0.g, c1.g) && equal(c0.b, c1.b))

    sys._updateColors = doAlpha || doColor
    sys.mesh.hasVertexAlpha = doAlpha

    if (!sys.material) return

    if (doColor || doAlpha) {
        sys.material.diffuseTexture = null
        sys.material.ambientTexture = sys.texture
        sys.material.opacityTexture = sys.texture
        sys.material.diffuseColor = col3.White()
        sys.material.useAlphaFromDiffuseTexture = true
        if (sys.texture) sys.texture.hasAlpha = false
    } else {
        sys.material.diffuseTexture = sys.texture
        sys.material.ambientTexture = null
        sys.material.opacityTexture = null
        sys.material.diffuseColor = new col3(c0.r, c0.g, c0.b)
        sys.material.useAlphaFromDiffuseTexture = false
        if (sys.texture) sys.texture.hasAlpha = true
    }

}
function equal(a, b) {
    return (Math.abs(a - b) < 1e-5)
}


function recalculateBounds(system) {
    // toooootal hack.
    var reps = 30
    var p = system._dummyParticle
    var s = 0,
        min = new vec3(Infinity, Infinity, Infinity),
        max = new vec3(-Infinity, -Infinity, -Infinity)
    var halfg = system.gravity / 2
    for (var i = 0; i < reps; ++i) {
        system.initParticle(p)
        updateMinMax(min, max, p.position.x, p.position.y, p.position.z)
        // x1 = x0 + v*t + 1/2*a*t^2
        var t = p.lifetime
        var x = p.position.x + t * p.velocity.x
        var y = p.position.y + t * p.velocity.y + t * t * halfg
        var z = p.position.z + t * p.velocity.z
        updateMinMax(min, max, x, y, z)
        s = Math.max(s, p.size)
    }
    min.subtractFromFloatsToRef(s, s, s, min)
    max.subtractFromFloatsToRef(-s, -s, -s, max)  // no addFromFloats, for some reason
    system.mesh._boundingInfo = new BABYLON.BoundingInfo(min, max)
}
function updateMinMax(min, max, x, y, z) {
    if (x < min.x) { min.x = x } else if (x > max.x) { max.x = x }
    if (y < min.y) { min.y = y } else if (y > max.y) { max.y = y }
    if (z < min.z) { min.z = z } else if (z > max.z) { max.z = z }
}



function addNewParticle(sys) {
    // pass dummy data structure to user-definable init fcn
    var part = sys._dummyParticle
    sys.initParticle(part)
    // copy particle data into internal Float32Array
    var data = sys._data
    var ix = sys._alive * NUM_PARAMS
    data[ix] = part.position.x
    data[ix + 1] = part.position.y
    data[ix + 2] = part.position.z
    data[ix + 3] = part.velocity.x
    data[ix + 4] = part.velocity.y
    data[ix + 5] = part.velocity.z
    data[ix + 6] = part.size
    data[ix + 7] = part.age
    data[ix + 8] = part.lifetime
    sys._alive += 1
}

function removeParticle(sys, n) {
    // copy particle data from last live location to removed location
    var data = sys._data
    var from = (sys._alive - 1) * NUM_PARAMS
    var to = n * NUM_PARAMS
    for (var i = 0; i < NUM_PARAMS; ++i) {
        data[to + i] = data[from + i]
    }
    sys._alive -= 1
}



/*
 *    animate all the particles!
*/

MPS.prototype.animate = function animateMPS(dt) {
    profile_hook('start')

    if (dt > 0.1) dt = 0.1
    if (this._needsColorUpdate) updateColorSettings(this)
    profile_hook('init')

    // add/update/remove particles
    spawnParticles(this, this.rate * dt)
    updateAndRecycle(this, dt)
    profile_hook('update')

    // write new position/color data
    updatePositionsData(this)
    profile_hook('positions')

    if (this._updateColors) updateColorsArray(this)
    // var t = 12 + performance.now()
    // while(performance.now()<t) {}
    profile_hook('colors')

    // only draw active mesh positions
    this.mesh.subMeshes[0].indexCount = this._alive * 6

    // possibly stop/dispose if no rate and no living particles
    if (this._alive === 0 && this.rate === 0) {
        if (this.disposeOnEmpty) this.dispose()
        else if (this.stopOnEmpty) this.stop()
    }
    profile_hook('end')
}


function spawnParticles(system, count) {
    system._toEmit += count
    var toAdd = Math.floor(system._toEmit)
    system._toEmit -= toAdd
    var ct = system._alive + toAdd
    if (ct > system.capacity) ct = system.capacity
    while (system._alive < ct) {
        addNewParticle(system)
    }
}

function updateAndRecycle(system, _dt) {
    // update particles and remove any that pass recycle check
    var dt = +_dt
    var grav = +system.gravity * dt
    var fric = +system.friction
    var data = system._data
    var updateFn = system.onParticleUpdate
    var max = system._alive * NUM_PARAMS
    for (var ix = 0; ix < max; ix += NUM_PARAMS) {
        data[ix + 4] += grav                  // vel.y += g * dt
        data[ix + 3] *= fric                  // vel *= friction*dt
        data[ix + 4] *= fric
        data[ix + 5] *= fric
        data[ix] += data[ix + 3] * dt         // pos += vel * dt
        data[ix + 1] += data[ix + 4] * dt
        data[ix + 2] += data[ix + 5] * dt
        data[ix + 7] += dt                    // age += dt
        updateFn(data, ix)                     // client-specified update function
        if (data[ix + 7] > data[ix + 8]) {     // if (age > lifetime)..
            removeParticle(system, (ix / NUM_PARAMS) | 0)
            ix -= NUM_PARAMS
            max = system._alive * NUM_PARAMS
        }
    }
}


// if mesh system has moved since last frame, adjust particles to compensate

function rebaseParticlePositions(system, dx, dy, dz) {
    system._lastPos.copyFrom(system.mesh.position)
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < .001) return

    var data = system._data
    var max = system._alive * NUM_PARAMS
    for (var di = 0; di < max; di += NUM_PARAMS) {
        data[di] -= dx
        data[di + 1] -= dy
        data[di + 2] -= dz
    }
}


function updatePositionsData(system) {
    var positions = system._positions
    var data = system._data
    var cam = system._scene.activeCamera

    // prepare transform
    var mat = BABYLON.Matrix.Identity()
    BABYLON.Matrix.LookAtLHToRef(
        cam.globalPosition,      // eye
        system.mesh.position,    // target
        vec3.Up(), mat
    )
    mat.m[12] = mat.m[13] = mat.m[14] = 0
    mat.invert()
    var m = mat.m

    var s0 = system._size0
    var ds = system._size1 - s0
    var vxSign = [-1, 1, 1, -1]
    var vySign = [-1, -1, 1, 1]

    var idx = 0
    var max = system._alive * NUM_PARAMS
    for (var di = 0; di < max; di += NUM_PARAMS) {
        var size = data[di + 6] * (s0 + ds * data[di + 7] / data[di + 8]) / 2

        for (var pt = 0; pt < 4; pt++) {
            var vx = size * vxSign[pt]
            var vy = size * vySign[pt]

            // following is unrolled version of Vector3.TransformCoordinatesToRef
            // minus the bits zeroed out due to having no z coord

            var w = (vx * m[3]) + (vy * m[7]) + m[15]
            positions[idx] = data[di] + (vx * m[0] + vy * m[4]) / w
            positions[idx + 1] = data[di + 1] + (vx * m[1] + vy * m[5]) / w
            positions[idx + 2] = data[di + 2] + (vx * m[2] + vy * m[6]) / w

            idx += 3
        }
    }

    system.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false)
}






function updateColorsArray(system) {
    var alive = system._alive
    var data = system._data
    var colors = system._colors

    var r0 = system._color0.r
    var g0 = system._color0.g
    var b0 = system._color0.b
    var a0 = system._color0.a
    var dr = system._color1.r - r0
    var dg = system._color1.g - g0
    var db = system._color1.b - b0
    var da = system._color1.a - a0

    var di = 0
    var idx = 0
    for (var i = 0; i < alive; i++) {

        // scale alpha from startAlpha to endAlpha by (age/lifespan)
        var scale = data[di + 7] / data[di + 8]

        var r = r0 + dr * scale
        var g = g0 + dg * scale
        var b = b0 + db * scale
        var a = a0 + da * scale

        for (var pt = 0; pt < 4; pt++) {
            colors[idx] = r
            colors[idx + 1] = g
            colors[idx + 2] = b
            colors[idx + 3] = a
            idx += 4
        }

        di += NUM_PARAMS
    }

    system.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors, false, false)
}



// dispose function

function disposeMPS(system) {
    system.stop()
    if (system._createdOwnMaterial) {
        system.material.ambientTexture = null
        system.material.opacityTexture = null
        system.material.diffuseTexture = null
        system.material.dispose(false, false)
    }
    system.material = null
    system.mesh.geometry.dispose()
    system.mesh.dispose()
    system.mesh = null
    system.texture = null
    system.curriedAnimate = null
    system.initParticle = null
    system._scene = null
    system._dummyParticle = null
    system._color0 = null
    system._color1 = null
    system._data = null
    system._positions.length = 0
    system._colors.length = 0
    system._positions = null
    system._colors = null
    system._disposed = true
}



/*
 *  hook function that client can specify for profiling 
*/

var profile_hook = (function () {
    if (window && window.MPS_profile_hook) return window.MPS_profile_hook
    return function () { }
})()

