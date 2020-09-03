const canvasDiv = document.getElementById('canvas');
const canvasFieldset = document.getElementById('canvasFS');
const canvas = document.getElementById('draw');
const dropDown = document.getElementById('selectModel');
const radioForm = document.getElementById('actionForm');
var buttonAction = document.getElementById('setAction');

var listActions = [{translation: [-20, 0, 0], rotation: [0, 0, 0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 'model1'},{translation: [20, 0, 0], rotation: 0, targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 'model2'}];
var listModels = [{translation: [-20, 0, 0], rotation: [0, 0, 0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 'model1'},{translation: [20, 0, 0], rotation: 0, targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 'model2'}];
var lastState = {};

// var objTranslation = [0, 0, 0];
// var objRotation =  [0, 0, 0];
var rotationDegree = 0;
// var rotationTarget = 'x';
// var objScale = [1, 1, 1];
// var scaleTarget = 'x';
var cameraPosition = [0, 0, 100];
var target = [0, 0, 0];
var up = [0, 1, 0];
var model = 'model';

canvasDiv.width = window.innerWidth - 300;
canvasDiv.height = window.innerHeight - 30;

canvas.width = window.innerWidth - 330;
canvas.height = window.innerHeight - 70;

buttonAction.addEventListener("click", () => {
  var option = document.getElementById('selectModel').value;
  model = document.forms.modelForm.elements.Model.value;
  getLastState(model);
  // console.log(lastState);
  var newState = {}
  var rotationHelp = lastState.rotation;
  var scaleHelp = lastState.scale;

  if(option == 'translation'){
    newState = {translation: [document.getElementById("sxTrans").value,document.getElementById("syTrans").value,document.getElementById("szTrans").value], rotation: lastState.rotation, targetRotation: lastState.targetRotation, scale: lastState.scale, targetScale: lastState.targetScale, model: model};
  }
  if(option == 'rotation'){
    rotationHelp[document.forms.rotationForm.elements.Rotation.value] = document.getElementById("Rot").value;
    newState = {translation: lastState.translation, rotation: rotationHelp, targetRotation: document.forms.rotationForm.elements.Rotation.value, scale: lastState.scale, targetScale: lastState.targetScale, model: model};
  }
  if(option == 'scale'){
    scaleHelp[document.forms.scaleForm.elements.Scale.value] = document.getElementById("Sca").value;
    newState = {translation: lastState.translation, rotation: lastState.rotation, targetRotation: lastState.targetRotation, scale: scaleHelp, targetScale: document.forms.scaleForm.elements.Scale.value, model: model};
  }
  // console.log(newState);
  listActions.push(newState);
});

dropDown.addEventListener("change", (event) => {
  var value = event.target.value;
  var model = document.getElementById('modelForm');
  var element = document.getElementById(value);
  oldElement = document.querySelector('.shown');
  
  if(element.id != "addModel"){
    model.classList.remove("hidden");
  }else{
    model.classList.add("hidden");
  }
  element.classList.remove("hidden");
  if(oldElement != null){
    oldElement.classList.add("hidden"); 
  }

  // putInPlace();
});

radioForm.addEventListener("change", () => {
  var radioTarget = document.getElementsByName('typeAction');

  if(radioTarget[0].checked){
    modelSelectorChange();
    cameraSelectorChange();
  }else{
    modelSelectorChange();
    cameraSelectorChange();
  }
});

function cameraSelectorChange(){
  var camera = document.getElementById('addCameraCheck');

  camera.classList.contains('hidden') ? camera.classList.remove('hidden') : camera.classList.add('hidden');
};

function modelSelectorChange(){
  var model = document.getElementById('addModelCheck');

  model.classList.contains('hidden') ? model.classList.remove('hidden') : model.classList.add('hidden');
};

function getLastState(model){
  listActions.forEach(action => {
    if(model == action.model){
      lastState = action;
    }
  });
}

// function putInPlace(){
//   getLastState(document.forms.modelForm.elements.Model.value);
//   // console.log(lastState);
//   objTranslation = lastState.translation;
//   objRotation = lastState.rotation;
//   rotationTarget = lastState.targetRotation;
//   objScale = lastState.scale;
//   scaleTarget = lastState.targetScale;
// }

var Init = function(){
  var vs = `#version 300 es

  in vec4 a_position;
  in vec4 a_color;

  uniform mat4 u_matrix;

  out vec4 v_color;

  void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
  }
  `;

  var fs = `#version 300 es
  precision highp float;

  // Passed in from the vertex shader.
  in vec4 v_color;

  uniform vec4 u_colorMult;

  out vec4 outColor;

  void main() {
  outColor = v_color * u_colorMult;
  }
  `;
  
  var canvas = document.getElementById('draw');
  var gl = canvas.getContext("webgl2");
  if (!gl) {
      return;
  }

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);
  var coneBufferInfo   = flattenedPrimitives.createTruncatedConeBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

  // setup GLSL program
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
  var coneVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, coneBufferInfo);

  function degToRad(d) {
      return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var colorOne = [0.0, 0.7, 0.74, 1];
  var colorTwo = [0.0, 0.51, 0.66, 1];
  var colorThree = [0.94, 0.44, 0.4, 1];

  // Uniforms for each object.
  var sphereUniforms = {
      u_colorMult: colorOne,
      u_matrix: m4.identity(),
  };
  var coneUniforms = {
    u_colorMult: colorThree,
    u_matrix: m4.identity(),
  };

  function computeMatrix(viewProjectionMatrix, translation, Rotation, scale) {
      var matrix = m4.translate(viewProjectionMatrix,
          translation[0],
          translation[1],
          translation[2]);

      matrix = m4.xRotate(matrix, degToRad(Rotation[0]));
      matrix = m4.yRotate(matrix, degToRad(Rotation[1]));
      matrix = m4.zRotate(matrix, degToRad(Rotation[2]));

      matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
      return matrix;
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
      time = time * 0.0005;

      twgl.resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);

      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

      // Compute the camera's matrix using look at.
      var cameraMatrix = m4.lookAt(cameraPosition, target, up);

      // Make a view matrix from the camera matrix.
      var viewMatrix = m4.inverse(cameraMatrix);

      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

      gl.useProgram(programInfo.program);

      // ------ Draw the sphere --------

      // Setup all the needed attributes.
      gl.bindVertexArray(sphereVAO);

      if(model == 'model1'){
        sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, objTranslation, objRotation, objScale);
      }else{
        getLastState('model1');
        sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, lastState.translation, lastState.rotation, lastState.scale);
      }
      
      // Set the uniforms we just computed
      twgl.setUniforms(programInfo, sphereUniforms);

      twgl.drawBufferInfo(gl, sphereBufferInfo);

      // ------ Draw the cone --------

      // Setup all the needed attributes.
      gl.bindVertexArray(coneVAO);
      
      if(model == 'model2'){
        coneUniforms.u_matrix = computeMatrix(viewProjectionMatrix, objTranslation, objRotation, objScale);
      }else{
        getLastState('model2');
        coneUniforms.u_matrix = computeMatrix(viewProjectionMatrix, lastState.translation, lastState.rotation, lastState.scale);
      }

      // Set the uniforms we just computed
      twgl.setUniforms(programInfo, coneUniforms);

      twgl.drawBufferInfo(gl, coneBufferInfo);

      requestAnimationFrame(drawScene);
  }
};

// Set the models to change with the slide bars

document.getElementById("xTdemo").innerHTML = document.getElementById("sxTrans").value;
document.getElementById("yTdemo").innerHTML = document.getElementById("syTrans").value;
document.getElementById("zTdemo").innerHTML = document.getElementById("szTrans").value;

document.getElementById("Rdemo").innerHTML = document.getElementById("Rot").value;

document.getElementById("Sdemo").innerHTML = document.getElementById("Sca").value;


document.getElementById("sxTrans").oninput = function() { 
  document.getElementById("xTdemo").innerHTML = this.value;
  objTranslation[0] = document.getElementById("sxTrans").value;
  model = document.forms.modelForm.elements.Model.value;
}
document.getElementById("syTrans").oninput = function() { 
  document.getElementById("yTdemo").innerHTML = this.value;
  objTranslation[1] = document.getElementById("syTrans").value;
  model = document.forms.modelForm.elements.Model.value;
}
document.getElementById("szTrans").oninput = function() { 
  document.getElementById("zTdemo").innerHTML = this.value;
  objTranslation[2] = document.getElementById("szTrans").value;
  model = document.forms.modelForm.elements.Model.value;
}

document.getElementById("Rot").oninput = function() { 
  document.getElementById("Rdemo").innerHTML = this.value;
  rotationDegree = document.getElementById("Rot").value;
  rotationTarget = document.forms.rotationForm.elements.Rotation.value;
  model = document.forms.modelForm.elements.Model.value;

  objRotation[rotationTarget] = rotationDegree;
}

document.getElementById("Sca").oninput = function() { 
  document.getElementById("Sdemo").innerHTML = this.value;
  scaleTarget = document.forms.scaleForm.elements.Scale.value;
  model = document.forms.modelForm.elements.Model.value;
  
  var value = document.getElementById("Sca").value;
  getLastState(model);

  objScale[scaleTarget] = value;
}