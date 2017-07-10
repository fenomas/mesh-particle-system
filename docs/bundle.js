!function(t){function e(o){if(i[o])return i[o].exports;var a=i[o]={i:o,l:!1,exports:{}};return t[o].call(a.exports,a,a.exports,e),a.l=!0,a.exports}var i={};e.m=t,e.c=i,e.i=function(t){return t},e.d=function(t,i,o){e.o(t,i)||Object.defineProperty(t,i,{configurable:!1,enumerable:!0,get:o})},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=1)}([function(t,e){function i(){this.position=y.Zero(),this.velocity=y.Zero(),this.size=1,this.age=0,this.lifetime=1}function o(t){t.position.copyFromFloats(0,0,0),t.velocity.x=5*(Math.random()-.5),t.velocity.y=.5*Math.random()*5+2,t.velocity.z=5*(Math.random()-.5),t.size=1*Math.random(),t.age=0,t.lifetime=2}function a(t,e,a,s){this.capacity=t,this.rate=e,this.mesh=new BABYLON.Mesh("SPS-mesh",s),this.material=new BABYLON.StandardMaterial("SPS-mat",s),this.texture=a,this.gravity=-1,this.friction=1,this.disposeOnEmpty=!1,this.stopOnEmpty=!1,this.parent=null,this.onDispose=null,this._scene=s,this._alive=0,this._data=new Float32Array(t*g),this._dummyParticle=new i,this._color0=new BABYLON.Color4(1,1,1,1),this._color1=new BABYLON.Color4(1,1,1,1),this._updateColors=!0,this._size0=1,this._size1=1,this._positions=[],this._colors=[],this._playing=!1,this._disposed=!1,this._lastPos=y.Zero(),this._startingThisFrame=!1,this._toEmit=0;for(var n=this._positions,l=this._colors,h=[],c=[],u=0;u<t;u++)n.push(0,0,0,0,0,0,0,0,0,0,0,0),h.push(4*u,4*u+1,4*u+2),h.push(4*u,4*u+2,4*u+3),c.push(0,1,1,1,1,0,0,0),l.push(1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1);var p=new BABYLON.VertexData;p.positions=n,p.indices=h,p.uvs=c,p.colors=l,p.applyToMesh(this.mesh,!0),this.mesh.material=this.material,this.material.specularColor=v.Black(),this.material.checkReadyOnlyOnce=!0,this.initParticle=o,r(this);var m=this,f=performance.now();this.curriedAnimate=function(){var t=performance.now(),e=(t-f)/1e3;m.animate(e),f=t}}function r(t){var e=t._color0,i=t._color1,o=!(s(e.a,1)&&s(e.a,i.a)),a=!(s(e.r,i.r)&&s(e.g,i.g)&&s(e.b,i.b));t.mesh.hasVertexAlpha=o,a||o?(t.material.ambientTexture=t.texture,t.material.opacityTexture=t.texture,t.material.diffuseTexture=null,t.texture.hasAlpha=!1,t.material.useAlphaFromDiffuseTexture=!0,t.material.diffuseColor=v.White()):(t.material.diffuseTexture=t.texture,t.material.ambientTexture=null,t.material.opacityTexture=null,t.texture.hasAlpha=!0,t.material.useAlphaFromDiffuseTexture=!1,t.material.diffuseColor=e),t._updateColors=o||a}function s(t,e){return Math.abs(t-e)<1e-5}function n(t){for(var e=30,i=t._dummyParticle,o=0,a=new y(1/0,1/0,1/0),r=new y(-(1/0),-(1/0),-(1/0)),s=t.gravity/2,n=0;n<e;++n){t.initParticle(i),l(a,r,i.position.x,i.position.y,i.position.z);var h=i.lifetime;l(a,r,i.position.x+h*i.velocity.x,i.position.y+h*i.velocity.y+h*h*s,i.position.z+h*i.velocity.z),o=Math.max(o,i.size)}a.subtractFromFloatsToRef(o,o,o,a),r.subtractFromFloatsToRef(-o,-o,-o,r),t.mesh._boundingInfo=new BABYLON.BoundingInfo(a,r)}function l(t,e,i,o,a){i<t.x?t.x=i:i>e.x&&(e.x=i),o<t.y?t.y=o:o>e.y&&(e.y=o),a<t.z?t.z=a:a>e.z&&(e.z=a)}function h(t){var e=t._dummyParticle;t.initParticle(e);var i=t._data,o=t._alive*g;i[o]=e.position.x,i[o+1]=e.position.y,i[o+2]=e.position.z,i[o+3]=e.velocity.x,i[o+4]=e.velocity.y,i[o+5]=e.velocity.z,i[o+6]=e.size,i[o+7]=e.age,i[o+8]=e.lifetime,t._alive+=1}function c(t,e){for(var i=t._data,o=(t._alive-1)*g,a=e*g,r=0;r<g;++r)i[a+r]=i[o+r];t._alive-=1}function u(t,e){t._toEmit+=e;var i=Math.floor(t._toEmit);t._toEmit-=i;var o=t._alive+i;for(o>t.capacity&&(o=t.capacity);t._alive<o;)h(t)}function p(t,e){for(var i=t.gravity*e,o=t._data,a=t.friction,r=0;r<t._alive;++r){var s=r*g;o[s+4]+=i,o[s+3]*=a,o[s+4]*=a,o[s+5]*=a,o[s]+=o[s+3]*e,o[s+1]+=o[s+4]*e,o[s+2]+=o[s+5]*e;var n=o[s+7]+e;n>o[s+8]?(c(t,r),r--):o[s+7]=n}}function m(t){if(t.parent){var e=t.parent.absolutePosition;t._startingThisFrame&&(e=t.parent.getAbsolutePosition(),t._startingThisFrame=!1),t.mesh.position.copyFrom(e)}var i=t.mesh.position.x-t._lastPos.x,o=t.mesh.position.y-t._lastPos.y,a=t.mesh.position.z-t._lastPos.z;if(t._lastPos.copyFrom(t.mesh.position),!(Math.abs(i)+Math.abs(o)+Math.abs(a)<.001))for(var r=t._alive,s=t._data,n=0;n<r;n++){var l=n*g;s[l]-=i,s[l+1]-=o,s[l+2]-=a}}function f(t){var e=t._positions,i=t._data,o=t._scene.activeCamera,a=BABYLON.Matrix.Identity();BABYLON.Matrix.LookAtLHToRef(o.globalPosition,t.mesh.position,y.Up(),a),a.m[12]=a.m[13]=a.m[14]=0,a.invert();for(var r=a.m,s=t._alive,n=t._size0,l=t._size1-n,h=0;h<s;h++)for(var c=h*g,u=i[c+7]/i[c+8],p=i[c+6]*(n+l*u)/2,m=12*h,f=0;f<4;f++){var _=1===f||2===f?p:-p,d=f>1?p:-p,v=_*r[3]+d*r[7]+r[15];e[m]=i[c]+(_*r[0]+d*r[4])/v,e[m+1]=i[c+1]+(_*r[1]+d*r[5])/v,e[m+2]=i[c+2]+(_*r[2]+d*r[6])/v,m+=3}t.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind,e,!1,!1)}function _(t){for(var e=t._alive,i=t._data,o=t._colors,a=t._color0.r,r=t._color0.g,s=t._color0.b,n=t._color0.a,l=t._color1.r-a,h=t._color1.g-r,c=t._color1.b-s,u=t._color1.a-n,p=0;p<e;p++)for(var m=p*g,f=i[m+7]/i[m+8],_=a+l*f,d=r+h*f,y=s+c*f,v=n+u*f,B=16*p,x=0;x<4;x++)o[B]=_,o[B+1]=d,o[B+2]=y,o[B+3]=v,B+=4;t.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind,o,!1,!1)}function d(t){t.stop(),t.material.ambientTexture=null,t.material.opacityTexture=null,t.material.diffuseTexture=null,t.material.dispose(),t.material=null,t.mesh.geometry.dispose(),t.mesh.dispose(),t.mesh=null,t.texture=null,t.curriedAnimate=null,t.initParticle=null,t._scene=null,t._dummyParticle=null,t._color0=null,t._color1=null,t._data=null,t._positions.length=0,t._colors.length=0,t._positions=null,t._colors=null,t.parent=null,t._disposed=!0}t.exports=a;var y=BABYLON.Vector3,v=BABYLON.Color3,B=a;B.prototype.start=function(){if(!this._playing){if(this._disposed)throw new Error("Already disposed");this._scene.registerBeforeRender(this.curriedAnimate),n(this),this._playing=!0,this._startingThisFrame=!0}},B.prototype.stop=function(){this._playing&&(this._scene.unregisterBeforeRender(this.curriedAnimate),this._playing=!1)},B.prototype.setAlphaRange=function(t,e){this._color0.a=t,this._color1.a=e,r(this)},B.prototype.setColorRange=function(t,e){this._color0.r=t.r,this._color0.g=t.g,this._color0.b=t.b,this._color1.r=e.r,this._color1.g=e.g,this._color1.b=e.b,r(this)},B.prototype.setSizeRange=function(t,e){this._size0=t,this._size1=e},B.prototype.emit=function(t){this.start(),this._toEmit+=t},B.prototype.dispose=function(){this.onDispose&&this.onDispose(),d(this)};var g=9;B.prototype.animate=function(t){t>.1&&(t=.1),m(this),u(this,this.rate*t),p(this,t),f(this),this._updateColors&&_(this),this.mesh.subMeshes[0].indexCount=6*this._alive,0===this._alive&&0===this.rate&&(this.disposeOnEmpty?this.dispose():this.stopOnEmpty&&this.stop())}},function(t,e,i){"use strict";function o(){u.render(),requestAnimationFrame(o)}function a(t){var e=new BABYLON.Texture("puff.png",t,!0,!1,1),i=2e3,o=300,a=new s(i,o,e,t);a.gravity=-5,a.setAlphaRange(1,0),a.setColorRange(c.Red(),c.Green()),a.setSizeRange(1,.5),a.mesh.position.y=2,a.initParticle=function(t){t.position.x=2*Math.random()-1,t.position.y=2*Math.random()-1,t.position.z=2*Math.random()-1,t.velocity.x=20*Math.random()-10,t.velocity.y=10*Math.random()+5,t.velocity.z=20*Math.random()-10,t.size=3*Math.random()+3,t.age=0,t.lifetime=2*Math.random()+1},a.start(),window.mps=a,window.scene=t}function r(t){function e(e,i,o){var a=BABYLON.Mesh.CreateBox("box1",1,t);a.position=e.subtractInPlace(i.scale(.5)),a.scaling=i,a.material=o}t.clearColor=new BABYLON.Color3(.7,.8,.9);var i=new BABYLON.ArcRotateCamera("camera",-1,1.4,90,new h(0,10,0),t);new BABYLON.HemisphericLight("light",new h(.1,1,.3),t);i.attachControl(n,!0);var o=BABYLON.Mesh.CreateGround("ground",80,80,1,t);o.material=new BABYLON.StandardMaterial("groundMat",t),o.material.diffuseColor=new c(.7,.7,.7);var a=new BABYLON.StandardMaterial("wallmat",t);a.diffuseColor=new c(.8,.6,.6);var r=new BABYLON.StandardMaterial("windowmat",t);r.diffuseColor=new c(.2,.2,.8),r.alpha=.4;e(new h(17,30,-30),new h(2,30,1),a),e(new h(-15,30,-30),new h(2,30,1),a),e(new h(15,30,-30),new h(30,5,1),a),e(new h(15,5,-30),new h(30,5,1),a),e(new h(15,25,-30),new h(30,20,1),r);return t}var s=i(0),n=document.getElementById("canvas"),l=new BABYLON.Engine(n),h=BABYLON.Vector3,c=BABYLON.Color3,u=new BABYLON.Scene(l);r(u),a(u),o()}]);