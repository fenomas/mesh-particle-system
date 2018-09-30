/* globals BABYLON */
'use strict'

window.MPS_profile_hook = createProfileHook()

// modules
var MPS = require('../')

// plumbing
var canvas = document.getElementById('canvas')
var engine = new BABYLON.Engine(canvas)



// code follows


var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3
var col4 = BABYLON.Color4


var scene = new BABYLON.Scene(engine)
setupScenery(scene)
setupParticles(scene)

function render() {
    scene.render()
    requestAnimationFrame(render)
}
render()





function setupParticles(scene) {

    var capacity = 20000
    var rate = 5000           // particles/second
    var startColor = new col4(1, 1, 1, 1)
    var uRange = [0, 1]
    var vRange = [0, 1]
    var mps = new MPS(capacity, rate, scene, startColor, uRange, vRange)

    var tex = new BABYLON.Texture('puff.png', scene, true, false, 1)
    mps.setTexture(tex)

    mps.gravity = -5
    mps.setAlphaRange(1, 0)
    mps.setColorRange(col3.Red(), col3.Green())
    mps.setSizeRange(1, 0.5)
    mps.mesh.position.y = 2
    // or: mps.parent = someOtherMesh

    mps.initParticle = function myInitParticle(pdata) {
        pdata.position.x = Math.random() * 2 - 1
        pdata.position.y = Math.random() * 2 - 1
        pdata.position.z = Math.random() * 2 - 1
        pdata.velocity.x = Math.random() * 20 - 10
        pdata.velocity.y = Math.random() * 10 + 5
        pdata.velocity.z = Math.random() * 20 - 10
        pdata.size = Math.random() * 3 + 3
        pdata.age = 0
        pdata.lifetime = Math.random() * 3 + 1
    }

    mps.onParticleUpdate = function (data, ix) {
        // for now, this function depends on internal data structure
        // data[ix..] => [px, py, pz, vx, vy, vz, size, age, lifetime]
        var py = data[ix + 1]
        if (py < -2) data[ix + 4] = -data[ix + 4]
    }

    mps.start()
    window.mps = mps
    window.scene = scene
    // scene.debugLayer.show()
    // mps.mesh.showBoundingBox = true
}




function setupScenery(scene) {
    // boilerplate
    scene.clearColor = new BABYLON.Color3(.7, .8, .9)
    var camera = new BABYLON.ArcRotateCamera('camera', -1, 1.4, 90, new vec3(0, 10, 0), scene)
    var light = new BABYLON.HemisphericLight('light', new vec3(0.1, 1, 0.3), scene)
    camera.attachControl(canvas, true)

    // grounding scenery
    var ground = BABYLON.Mesh.CreateGround('ground', 80, 80, 1, scene)
    ground.material = new BABYLON.StandardMaterial("groundMat", scene)
    ground.material.diffuseColor = new col3(0.7, 0.7, 0.7)
    function makeBox(pos, scale, mat) {
        var box = BABYLON.Mesh.CreateBox("box1", 1, scene)
        box.position = pos.subtractInPlace(scale.scale(.5))
        box.scaling = scale
        box.material = mat
    }
    var wallmat = new BABYLON.StandardMaterial("wallmat", scene)
    wallmat.diffuseColor = new col3(.8, 0.6, 0.6)
    var windowmat = new BABYLON.StandardMaterial("windowmat", scene)
    windowmat.diffuseColor = new col3(0.2, 0.2, 0.8)
    windowmat.alpha = 0.4
    makeBox(new vec3(17, 30, -30), new vec3(2, 30, 1), wallmat)
    makeBox(new vec3(-15, 30, -30), new vec3(2, 30, 1), wallmat)
    makeBox(new vec3(15, 30, -30), new vec3(30, 5, 1), wallmat)
    makeBox(new vec3(15, 5, -30), new vec3(30, 5, 1), wallmat)
    makeBox(new vec3(15, 25, -30), new vec3(30, 20, 1), windowmat)

    return scene
}














/*
 *    utility timer 
*/

function createProfileHook() {
    var timer = new Timer(200, 'particles')
    return function (name) {
        if (name === 'start') timer.start()
        else if (name === 'end') timer.report()
        else timer.add(name)
    }
}


// simple thing for reporting time split up between several activities
function Timer(_every, _title) {
    var title = _title || ''
    var every = _every || 1
    var times = {}
    var names = []
    var started = +0
    var last = +0
    var total = +0
    var iter = 0 | 0
    var clearNext = true

    this.start = function () {
        if (clearNext) {
            times = {}
            names = []
            clearNext = false
        }
        started = last = performance.now()
        iter++
    }
    this.add = function (name) {
        if (!names.includes(name)) names.push(name)
        var t = performance.now()
        times[name] = (times[name] || +0) + t - last
        last = t
    }
    this.report = function () {
        total += performance.now() - started
        if (iter === every) {
            var head = title + ' total ' + (total / every).toFixed(2) + 'ms (avg, ' + every + ' runs)    '
            console.log(head, names.map(function (name) {
                return name + ': ' + (times[name] / every).toFixed(2) + 'ms    '
            }).join(''))
            clearNext = true
            iter = 0
            total = 0
        }
    }
}






