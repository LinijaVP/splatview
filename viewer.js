"use strict";

const vertexShaderSource = `
    attribute vec3 position;
    attribute vec3 color;
    varying vec3 vColor;

    void main() {
      gl_Position = vec4(position, 1.0);
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

function dragOverHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

async function dropHandler(ev) {
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
      colors = new Float32Array(data.color)
      main();
    } else {
      alert("Failed to process the file.");
    }
  } else {
    alert("Please drop a valid .ply file.");
  }
  
}
var positions = new Float32Array([0.0,0.0,0.0,0.4,0.2,0.1]);
var colors = new Float32Array([0.1,0.2,0.3,0.3,0.3,0.3]);

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

  //console.log(data)
  console.log("Rendering...")
  
  
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
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  



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


main()