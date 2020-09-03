var objTranslation = [0, 10, 0];
var objRotation =  [0, 0, 0];
var cameraPosition = [0, 40, 100]; //[profundidade, girar pra cima e pra baixo, ]
var target = [0, 30, 0];//[laterais, pra baixo, pra cima]
var up = [0, 1, 0];//qual lado fica de frente pra câmera

const canvasDiv = document.getElementById('canvas');
const canvas = document.getElementById('draw');

canvasDiv.width = window.innerWidth;
canvasDiv.height = window.innerHeight-5;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight-5;

document.addEventListener('keydown', (event) => {
  var key = event.key;
  if(key == 'ArrowLeft'){
    objRotation[0] = 0;
    objRotation[2] += 20;
  }
  if(key == 'ArrowRight'){
    objRotation[0] = 0;
    objRotation[2] -= 20;
  }
  if(key == 'ArrowUp'){
    objRotation[2] = 0;
    objRotation[0] -= 20;
  }
  if(key == 'ArrowDown'){
    objRotation[2] = 0;
    objRotation[0] += 20;
  }
});

document.addEventListener('keyup', (event) => {
  var key = event.key;
  if(key == 'ArrowLeft'){
    objRotation[0] = 0;
    objRotation[2] += 20;
  }
  if(key == 'ArrowRight'){
    objRotation[0] = 0;
    objRotation[2] -= 20;
  }
  if(key == 'ArrowUp'){
    objRotation[2] = 0;
    objRotation[0] -= 20;
  }
  if(key == 'ArrowDown'){
    objRotation[2] = 0;
    objRotation[0] += 20;
  }
});

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

var Init = function(){
  const vs = `#version 300 es

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

  const fs = `#version 300 es
  precision highp float;

  // Passed in from the vertex shader.
  in vec4 v_color;

  uniform vec4 u_colorMult;

  out vec4 outColor;

  void main() {
  outColor = v_color * u_colorMult;
  }
  `;


  
  // var canvas = document.getElementById('draw');
  var gl = canvas.getContext("webgl2");
  if (!gl) {
      return;
  }

  // Use our boilerplate utils to compile the shaders and link into a program
  var program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource]);

  if(!program){
    console.log('deu ruim');
  }

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 20);
  var planeBufferInfo = flattenedPrimitives.createPlaneBufferInfo(gl, 500, 200, 1, 1);

  // setup GLSL program
  const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
  var planeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, planeBufferInfo);

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  function degToRad(d) {
      return d * Math.PI / 180;
  }

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // First let's make some variables
  // to hold the translation, width and height of the rectangle
  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];

  var fieldOfViewRadians = degToRad(60);
  var colorOne = [0.12, 0.31, 0.47, 1];//204f78
  var colorTwo = [0.09, 0.28, 0.44, 1];//174771
  var colorThree = [0.94, 0.44, 0.4, 1];

  // Uniforms for each object.
  var sphereUniforms = {
      u_colorMult: colorThree,
      u_matrix: m4.identity(),
  };

  var planeUniforms = {
    u_colorMult: colorOne,
    u_matrix: m4.identity(),
  };

  function computeMatrix(viewProjectionMatrix, translation, Rotation) {
      var matrix = m4.translate(viewProjectionMatrix,
          translation[0],
          translation[1],
          translation[2]);

      matrix = m4.xRotate(matrix, degToRad(Rotation[0]));
      matrix = m4.yRotate(matrix, degToRad(Rotation[1]));
      matrix = m4.zRotate(matrix, degToRad(Rotation[2]));

      return matrix;
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.0005;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(programInfo.program);

    // ------ Draw the sphere --------

    // Setup all the needed attributes.
    gl.bindVertexArray(sphereVAO);

    sphereUniforms.u_matrix = computeMatrix(viewProjectionMatrix, objTranslation, objRotation);
    
    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Draw the plane --------

    // Setup all the needed attributes.
    gl.bindVertexArray(planeVAO);

    planeUniforms.u_matrix = computeMatrix(viewProjectionMatrix, [0,0,0], [0,0,0]);
    
    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, planeUniforms);

    twgl.drawBufferInfo(gl, planeBufferInfo);

    // ------ Draw the square --------
    gl.useProgram(program);

    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Update the position buffer with rectangle positions
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, translation[0], translation[1], width, height);

    // Set a random color.
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  };

  function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
  }
};