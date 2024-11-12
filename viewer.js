"use strict";

import { mat4, vec3} from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

var positions = new Float32Array([0.0,0.0,0.0]);
var colors = new Uint8Array([15,20,25]);

// Movement parameters
const speed = 0.1;
const rotationSpeed = 0.02;
let yaw = 0;
let pitch = 0;

// Camera variables
const cameraPos = vec3.fromValues(0, 0, 5);  // Camera position
const cameraTarget = vec3.fromValues(0, 0, 0);  // Camera looks at the origin
const upVector = vec3.fromValues(0, 1, 0);  // Up direction



// Handle keyboard input
var keys = {};
window.addEventListener('keydown', (e) => {
  console.log("hello")
  keys[e.key] = true
  //updateCamera()
});
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Handle mouse movement for rotation
canvas.addEventListener('mousemove', (e) => {
  yaw -= e.movementX * rotationSpeed;
  pitch -= e.movementY * rotationSpeed;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});


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
      main();
    } else {
      alert("Failed to process the file.");
    }
  } else {
    alert("Please drop a valid .ply file.");
  }
  
})


// Helper functions for main function


const vertexShaderSource = `
  attribute vec3 position;
  attribute vec3 color;
  varying vec3 vColor;

  uniform mat4 uModel;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main() {
    gl_Position = uProjection * uView * uModel * vec4(position, 1.0);
    gl_PointSize = 2.0;
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

await fetch('./data.json')
    .then((response) => response.json())
    .then((json) => {
      positions = new Float32Array(json.position);
      colors = new Uint8Array(json.color);
      main();
    })

// MAIN function for rendering

function updateCamera(){
  const front = vec3.fromValues(
    Math.cos(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.sin(yaw) * Math.cos(pitch)
  );
  vec3.normalize(front, front);

  if (keys['w']) vec3.add(cameraPos, cameraPos, vec3.scale(vec3.create(), front, speed));
  if (keys['s']) vec3.subtract(cameraPos, cameraPos, vec3.scale(vec3.create(), front, speed));

  const right = vec3.cross(vec3.create(), front, upVector);
  vec3.normalize(right, right);

  if (keys['a']) vec3.subtract(cameraPos, cameraPos, vec3.scale(vec3.create(), right, speed));
  if (keys['d']) vec3.add(cameraPos, cameraPos, vec3.scale(vec3.create(), right, speed));

  const cameraTarget = vec3.add(vec3.create(), cameraPos, front);
  mat4.lookAt(view, cameraPos, cameraTarget, upVector);
  main()
}

function main() {
  // Get A WebGL context
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
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
  var zNear = 0.1;
  var zFar = 100;
  //mat4.perspective(projection, Math.PI/1.5, aspect, zNear, zFar);

  gl.uniformMatrix4fv(modelLocation,false, model);
  gl.uniformMatrix4fv(viewLocation,false, view);
  gl.uniformMatrix4fv(projectionLocation,false, projection);


  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // Enable the depth test
  gl.enable(gl.DEPTH_TEST);
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, positions.length/3);
  console.log("Rendered")
}
