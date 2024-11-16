"use strict";

import { mat4, vec3, glMatrix} from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

var positions = new Float32Array([0.0,0.0,0.0, 0.5,0.5,0.5]);
var colors = new Uint8Array([15,20,25, 50, 60, 70]);

await fetch('./data.json')
  .then((response) => response.json())
  .then((json) => {
    positions = new Float32Array(json.position);
    colors = new Uint8Array(json.color);
})

// Movement parameters
let cameraPosition = [0, 0, 0];
const speed = 0.01;
const cameraSpeed = 0.01;
const rotationSpeed = 1;
let yaw = 0;
let pitch = 0;

// Camera variables
const cameraPos = vec3.fromValues(0, 0, 0.5);  // Camera position
const cameraTarget = vec3.fromValues(0, 0, 0);  // Camera looks at the origin
const upVector = vec3.fromValues(0, 1, 0);  // Up direction


// Helper functions for main function

// Handle keyboard input
var keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true
});
window.addEventListener('keyup', (e) => keys[e.key] = false);


const vertexShaderSource = `
  attribute vec3 position;
  attribute vec3 color;
  varying vec3 vColor;

  uniform mat4 uModel;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main() {
    gl_Position = uProjection * uView * uModel * vec4(position, 1.0);
    gl_PointSize = 5.0;
    vColor = color;
  }
`;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}





// Get A WebGL context
var canvas = document.querySelector("#canvas");
var gl = canvas.getContext("webgl2");
if (!gl) {
  alert("gl not initialized");
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER,vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

var program = createProgram(gl,vertexShader, fragmentShader)

gl.useProgram(program);
const error = gl.getError();
if (error !== gl.NO_ERROR) console.error('WebGL error:', error);  

console.log("Rendering...")
//console.log("Rendering... " + positions.length + " points")


const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getAttribLocation(program, 'color');


const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, null);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
gl.enableVertexAttribArray(colorLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, null);

const modelLocation = gl.getUniformLocation(program, 'uModel');
const viewLocation = gl.getUniformLocation(program, 'uView');
const projectionLocation = gl.getUniformLocation(program, 'uProjection');

const model = mat4.create();
const view = mat4.create();
const projection = mat4.create();

// Compute the projection matrix
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 0.01;
var zFar = 100;
mat4.perspective(projection, glMatrix.toRadian(45), aspect, zNear, zFar);

gl.uniformMatrix4fv(modelLocation,false, model);
gl.uniformMatrix4fv(viewLocation,false, view);
gl.uniformMatrix4fv(projectionLocation,false, projection);


function render() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  updateViewMatrix()
  gl.uniformMatrix4fv(viewLocation,false, view);

  // Enable the depth test and CULL FACE
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE)
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, positions.length/3);
  console.log("Rendered")
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function updateViewMatrix() {
  const front = [
    Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch)),
    Math.sin(glMatrix.toRadian(pitch)),
    Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch))
  ];
  vec3.normalize(front, front);

  const right = vec3.cross([], front, [0, 1, 0]); // Right vector
  vec3.normalize(right, right);

  if(keys["w"]) vec3.scaleAndAdd(cameraPosition, cameraPosition, front, cameraSpeed);
  if(keys["a"]) vec3.scaleAndAdd(cameraPosition, cameraPosition, right, -cameraSpeed);
  if(keys["s"]) vec3.scaleAndAdd(cameraPosition, cameraPosition, front, -cameraSpeed);
  if(keys["d"]) vec3.scaleAndAdd(cameraPosition, cameraPosition, right, cameraSpeed);
  if(keys["ArrowUp"]) pitch = Math.min(pitch + rotationSpeed, 89); // Clamp to avoid flipping
  else if(keys["ArrowDown"]) pitch = Math.max(pitch - rotationSpeed, -89);
  if(keys["ArrowLeft"]) yaw -= rotationSpeed;
  else if(keys["ArrowRight"]) yaw += rotationSpeed;

  const targetPoint = [
    cameraPosition[0] + Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch)),
    cameraPosition[1] + Math.sin(glMatrix.toRadian(pitch)),
    cameraPosition[2] + Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch)),
  ];
  mat4.lookAt(view, cameraPosition, targetPoint, [0, 1, 0]);
}

const dropArea = document.getElementById('drop-area');

dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  //console.log('Dragged over');
});

dropArea.addEventListener('drop', async (ev) => {
  ev.preventDefault();
  console.log(ev.dataTransfer.files)
  const file = ev.dataTransfer.files[0];
  if (file && file.name.endsWith(".ply")) {
    const formData = new FormData();
    formData.append("file", file);
    console.log("Sending " + file.name + " for processing")
    // Send file to the backend
    const response = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      positions = new Float32Array(data.position);
      colors = new Uint8Array(data.color)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.enableVertexAttribArray(colorLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      
    } else {
      alert("Failed to process the file.");
    }
  } else {
    alert("Please drop a valid .ply file.");
  }
  
})

