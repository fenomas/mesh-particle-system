/* globals BABYLON */
'use strict';

// modules
var MPS = require('../')

// plumbing
var canvas = document.getElementById('canvas')
var engine = new BABYLON.Engine(canvas)



// code follows


var vec3 = BABYLON.Vector3
var col3 = BABYLON.Color3


var scene = new BABYLON.Scene(engine);
setupScenery(scene)
setupParticles(scene)

function render() {
  scene.render()
  requestAnimationFrame(render)
}
render()





function setupParticles(scene) {
  var tex = new BABYLON.Texture('puff.png', scene, true, false, 1);

  var capacity = 200;
  var rate = 30;           // particles/second
  var mps = new MPS(capacity, rate, tex, scene);

  mps.gravity = -5;
  mps.setAlphaRange( 1, 0 );
  mps.setColorRange( col3.Red(), col3.Green() );
  mps.setSizeRange( 1, 0.5 );
  mps.mesh.position.y = 2;
  // or: mps.parent = someOtherMesh

  mps.initParticle = function myInitParticle(pdata) {
    pdata.position.x = Math.random() * 2 - 1;
    pdata.position.y = Math.random() * 2 - 1;
    pdata.position.z = Math.random() * 2 - 1;
    pdata.velocity.x = Math.random() * 20 - 10;
    pdata.velocity.y = Math.random() * 10 + 5;
    pdata.velocity.z = Math.random() * 20 - 10;
    pdata.size =       Math.random() * 3 + 3;
    pdata.age = 0;
    pdata.lifetime =   Math.random() * 2 + 1;
  }
  
  mps.start();
  window.mps = mps;
  window.scene = scene
  // scene.debugLayer.show();
  // mps.mesh.showBoundingBox = true;
}




function setupScenery(scene) {
  // boilerplate
  scene.clearColor = new BABYLON.Color3( .7, .8, .9)
  var camera = new BABYLON.ArcRotateCamera('camera', -1, 1.4, 90, new vec3(0,10,0), scene)
  var light = new BABYLON.HemisphericLight('light', new vec3(0.1,1,0.3), scene )
  camera.attachControl(canvas, true)

  // grounding scenery
  var ground = BABYLON.Mesh.CreateGround('ground', 80, 80, 1, scene)
  ground.material = new BABYLON.StandardMaterial("groundMat", scene);
  ground.material.diffuseColor = new col3(0.7, 0.7, 0.7);
  function makeBox(pos, scale, mat) {
    var box = BABYLON.Mesh.CreateBox("box1", 1, scene);
    box.position = pos.subtractInPlace( scale.scale(.5) )
    box.scaling = scale
    box.material = mat
  }
  var wallmat = new BABYLON.StandardMaterial("wallmat", scene);
  wallmat.diffuseColor = new col3(.8, 0.6, 0.6);
  var windowmat = new BABYLON.StandardMaterial("windowmat", scene);
  windowmat.diffuseColor = new col3(0.2, 0.2, 0.8);
  windowmat.alpha = 0.4;
  var box1 = makeBox( new vec3( 17,30,-30), new vec3( 2,30,1), wallmat )
  var box2 = makeBox( new vec3(-15,30,-30), new vec3( 2,30,1), wallmat )
  var box3 = makeBox( new vec3( 15,30,-30), new vec3(30, 5,1), wallmat )
  var box4 = makeBox( new vec3( 15, 5,-30), new vec3(30, 5,1), wallmat )
  var box5 = makeBox( new vec3( 15,25,-30), new vec3(30,20,1), windowmat )

  return scene
}









