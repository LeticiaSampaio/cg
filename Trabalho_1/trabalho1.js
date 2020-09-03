const canvasDiv = document.getElementById('canvas');
const canvasFieldset = document.getElementById('canvasFS');
const canvas = document.getElementById('draw');
const dropDown = document.getElementById('selectModel');
const radioForm = document.getElementById('actionForm');
var buttonAction = document.getElementById('setAction');
var actionBox = document.getElementById('actions');

var listActions = [{typeOfMovement: 'beginning', translation: [-20, 0, 0], rotation: [0, 0, 0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 0},{typeOfMovement: 'beginning', translation: [20, 0, 0], rotation: [0,0,0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 1}];
var listModels = [{typeOfMovement: 'beginning', translation: [-20, 0, 0], rotation: [0, 0, 0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 0},{typeOfMovement: 'beginning', translation: [20, 0, 0], rotation: [0,0,0], targetRotation: 'x', scale: [1, 1, 1], targetScale: 'x', model: 1}];
var lastState = {};
var lastMovement = {};

var objTranslation = [0, 0, 0];
var objRotation =  [0, 0, 0];
var rotationDegree = 0;
var rotationTarget = 'x';
var objScale = [1, 1, 1];
var scaleTarget = 'x';
var cameraPosition = [0, 0, 100];
var target = [0, 0, 0];
var up = [0, 1, 0];
var model = 0;
var action = false;
var start = 2;

canvasDiv.width = window.innerWidth - 300;
canvasDiv.height = window.innerHeight - 30;

canvas.width = window.innerWidth - 330;
canvas.height = window.innerHeight - 70;

buttonAction.addEventListener("click", () => {
  var option = document.getElementById('selectModel').value;
  model = parseInt(document.forms.modelForm.elements.Model.value);
  getLastState(model);
  
  var newState = {}
  var rotationHelp = lastState.rotation;
  var scaleHelp = lastState.scale;

  if(option == 'translation'){
    newState = {typeOfMovement: option, translation: [document.getElementById("sxTrans").value,document.getElementById("syTrans").value,document.getElementById("szTrans").value], rotation: lastState.rotation, targetRotation: lastState.targetRotation, scale: lastState.scale, targetScale: lastState.targetScale, model: model};
  }
  if(option == 'rotation'){
    rotationHelp[document.forms.rotationForm.elements.Rotation.value] = document.getElementById("Rot").value;
    newState = {typeOfMovement: option, translation: lastState.translation, rotation: rotationHelp, targetRotation: document.forms.rotationForm.elements.Rotation.value, scale: lastState.scale, targetScale: lastState.targetScale, model: model};
  }
  if(option == 'scale'){
    scaleHelp[document.forms.scaleForm.elements.Scale.value] = document.getElementById("Sca").value;
    newState = {typeOfMovement: option, translation: lastState.translation, rotation: lastState.rotation, targetRotation: lastState.targetRotation, scale: scaleHelp, targetScale: document.forms.scaleForm.elements.Scale.value, model: model};
  }
  
  listActions.push(newState);
  setListActions();
});

dropDown.addEventListener("change", (event) => {
  var element = document.getElementById(event.target.value);
  var models = document.getElementById('modelForm');
  var camera = document.getElementById('cameraForm');
  var ulElements = document.querySelectorAll('ul');
  model = parseInt(document.forms.modelForm.elements.Model.value);
  
  ulElements.forEach(el => {
    if(element != el){
      el.classList.add('hidden');
    }else{
      getLastState(model);
      listModels[model] = lastState;
      setRanges(lastState);
      el.classList.remove('hidden');
    }
  });

  if(document.forms.actionForm.elements.typeAction.value == 'model'){
    models.classList.remove('hidden');
    camera.classList.add('hidden');    
  }else{
    models.classList.add('hidden');
    camera.classList.remove('hidden');
  }
  
  model = 0;
});

radioForm.addEventListener("change", () => {
  var radioTarget = document.getElementsByName('typeAction');
  var camera = document.getElementById('addCameraCheck');
  var model = document.getElementById('addModelCheck');

  camera.classList.contains('hidden') ? camera.classList.remove('hidden') : camera.classList.add('hidden');
  model.classList.contains('hidden') ? model.classList.remove('hidden') : model.classList.add('hidden');
});

function setRanges(element){
  document.getElementById("sxTrans").value = element.translation[0];
  document.getElementById("xTdemo").innerHTML = element.translation[0];
  document.getElementById("syTrans").value = element.translation[1];
  document.getElementById("yTdemo").innerHTML = element.translation[1];
  document.getElementById("szTrans").value = element.translation[2];
  document.getElementById("zTdemo").innerHTML = element.translation[2];

  document.getElementById("Rot").value = element.rotation[0];
  document.getElementById("Rdemo").innerHTML = element.rotation[0];

  document.getElementById("Sca").value = element.scale[0];
  document.getElementById("Sdemo").innerHTML = element.scale[0];
}

function getLastState(model){
  listActions.forEach(action => {
    if(model == action.model){
      lastState = action;
    }
  });
}

function setListActions(){
  actionBox.innerHTML = "";
  listActions.forEach(element => {
    actionBox.innerHTML += `<p style="border: 1px solid var(--grey);margin: 0;padding-top: 5px;padding-bottom: 5px;">Movement element: ${element.model}<br>Type of movement: ${element.typeOfMovement}<p>`;
  });
}

document.getElementById('Go').addEventListener('click', () => {
  if(!!listActions[start]){
    action = true;

    if(listActions[start].model == listActions[start-2].model){
      lastMovement = listActions[start-2];
    }else{
      lastMovement = listActions[start-1];
    }
  }
});

function getState(){
  var nextState = listActions[start+1];
  
  for (let i = start; i > 0; i--) {
    if(nextState.model == listActions[start].model){
      return listActions[start];
    }
  }
  return nextState;
}

document.getElementById('Clear').addEventListener('click', () => {
  while(listActions.length > 2){
    listActions.pop();
  }
  actionBox.innerHTML = "";
});

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

      if(!action){
        if(model == 0){
          sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, listModels[0].translation, listModels[0].rotation, listModels[0].scale);
        }else{
          getLastState(0);
          sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, lastState.translation, lastState.rotation, lastState.scale);
        }
      }else if(!!listActions[start]){
        if(listActions[start].model == 0 && lastMovement != listActions[start]){
          objTranslation = listActions[start].translation;
          objRotation = listActions[start].rotation;
          objScale = listActions[start].scale;
          
          sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, objTranslation, objRotation, objScale);
        }else{
          if(!!listActions[start+1]){
            lastMovement = getState();
          }
        }
        start += 1;
      }else{
        action = false;
        start = 2;
      }
      
      // Set the uniforms we just computed
      twgl.setUniforms(programInfo, sphereUniforms);

      twgl.drawBufferInfo(gl, sphereBufferInfo);

      // ------ Draw the cone --------

      // Setup all the needed attributes.
      gl.bindVertexArray(coneVAO);
      
      if(!action){
        if(model == 1){
          coneUniforms.u_matrix = computeMatrix(viewProjectionMatrix, listModels[1].translation, listModels[1].rotation, listModels[1].scale);
        }
        else{
          getLastState(1);
          coneUniforms.u_matrix = computeMatrix(viewProjectionMatrix, lastState.translation, lastState.rotation, lastState.scale);
        }
      }else if(!!listActions[start]){
        if(listActions[start].model == 1 && lastMovement != listActions[start]){
          objTranslation = listActions[start].translation;
          objRotation = listActions[start].rotation;
          objScale = listActions[start].scale;
          
          coneUniforms.u_matrix = computeMatrix(viewProjectionMatrix, objTranslation, objRotation, objScale);
        }else{
          if(!!listActions[start+1]){
            lastMovement = getState(); 
          }
        }
        start += 1;
      }else{
        action = false;
        start = 2;
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
  model = parseInt(document.forms.modelForm.elements.Model.value);
  listModels[model].translation[0] = document.getElementById("sxTrans").value;
}
document.getElementById("syTrans").oninput = function() { 
  document.getElementById("yTdemo").innerHTML = this.value;
  model = parseInt(document.forms.modelForm.elements.Model.value);
  listModels[model].translation[1] = document.getElementById("syTrans").value;
}
document.getElementById("szTrans").oninput = function() { 
  document.getElementById("zTdemo").innerHTML = this.value;
  model = parseInt(document.forms.modelForm.elements.Model.value);
  listModels[model].translation[2] = document.getElementById("szTrans").value;
}

document.getElementById("Rot").oninput = function() { 
  document.getElementById("Rdemo").innerHTML = this.value;
  rotationDegree = document.getElementById("Rot").value;
  rotationTarget = document.forms.rotationForm.elements.Rotation.value;
  model = parseInt(document.forms.modelForm.elements.Model.value);

  listModels[model].rotation[rotationTarget] = rotationDegree;
}

document.getElementById("Sca").oninput = function() { 
  document.getElementById("Sdemo").innerHTML = this.value;
  scaleTarget = document.forms.scaleForm.elements.Scale.value;
  model = parseInt(document.forms.modelForm.elements.Model.value);
  
  var value = document.getElementById("Sca").value;

  listModels[model].scale[scaleTarget] = value;
}
