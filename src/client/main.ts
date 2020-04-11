import { glMatrix, mat4 } from 'gl-matrix';


// REWORK TO CLASS AND MAKE IT USE ONLY PARTICULAR EVENT HANDLERS 

export const initCanvas = (): WebGLProgram | null => {
  try {
    console.log('Canvas initialization...');

    const canvas = document.getElementById('root-canvas') as HTMLCanvasElement | null;

    if (canvas === null) {
      alert('Canvas was not loaded, please try to restart the page');
      return null;
    }

    const gl = canvas.getContext('webgl')
      || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

    if (gl === null) {
      alert('Your browser does not support WebGL');
      return null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if ('viewport' in gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    gl.clearColor(...getBackgroundColor(), 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    const program = initProgram(gl);
    const data = objectData();

    bindObjectData(data, gl, program);
    setView(gl, program, canvas);
		runAnimation(gl, program);
		
		return program;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const initProgram = (gl: WebGLRenderingContext): WebGLProgram => {
  // source code of the shader
  const vertexShaderCode = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    varying vec3 fragColor;
    uniform mat4 matWorld;
    uniform mat4 matView;
    uniform mat4 matProjection;

    void main()
    {
      fragColor = vertColor;
      gl_Position = matProjection * matView * matWorld * vec4(vertPosition, 1.0);
    }
  `;

  const fragmentShaderCode = `
    precision mediump float;

    varying vec3 fragColor;

    void main()
    {
      gl_FragColor = vec4(fragColor, 1.0);
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader; // returns the webgl shader with specified type
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;

	gl.shaderSource(vertexShader, vertexShaderCode); // write the source code of webgl shader into the shader 
	gl.shaderSource(fragmentShader, fragmentShaderCode);

	gl.compileShader(vertexShader); // compiles the GLSL source code of the shader into the binary data
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		throw `Error occurred while compiling the vertex shader: ${gl.getShaderInfoLog(vertexShader)}`;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		throw `Error occurred while compiling the fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`;
	}

	const program = gl.createProgram() as WebGLProgram; // creates and initializes the webgl program 
	gl.attachShader(program, vertexShader); // attaches the shader to webgl program
  gl.attachShader(program, fragmentShader);
  
  gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw `Error occurred while linking the program: ${gl.getProgramInfoLog(program)}`;
  }
  
  gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		throw `Error occurred while validating the program: ${gl.getProgramInfoLog(program)}`;
	}

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);
  
  return program;
};

const bindObjectData = (objectData: { vertices: number[], indices: number[] },
  gl: WebGLRenderingContext, program: WebGLProgram): void => {
  const { vertices, indices } = objectData;
  const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

  const boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	const boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
 
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false,
		6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.vertexAttribPointer(
		colorAttribLocation,
		3,
		gl.FLOAT,
		false,
		6 * Float32Array.BYTES_PER_ELEMENT,
		3 * Float32Array.BYTES_PER_ELEMENT
	);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);
};

const setView = (gl: WebGLRenderingContext, program: WebGLProgram, canvas: HTMLCanvasElement): void => {
  const matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');
	const matViewUniformLocation = gl.getUniformLocation(program, 'matView');
	const matProjectionUniformLocation = gl.getUniformLocation(program, 'matProjection');

	let worldMatrix = new Float32Array(16);
	let viewMatrix = new Float32Array(16);
	let projectionMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [-2, 2, -10], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
  gl.uniformMatrix4fv(matProjectionUniformLocation, false, projectionMatrix);
};

const runAnimation = function (gl: WebGLRenderingContext, program: WebGLProgram): void {
	// let angle = 0;
	// let xRotationMatrix = new Float32Array(16);
	// let yRotationMatrix = new Float32Array(16);
	let worldMatrix = new Float32Array(16);
  let identityMatrix = new Float32Array(16);
  const { indices } = objectData();
  const matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');

	mat4.identity(worldMatrix);
  mat4.identity(identityMatrix);

	const loop = function () {
		// angle = performance.now() / 1000 / 10 * 2 * Math.PI;
		// mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
		// mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
		// mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
		gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);

    gl.clearColor(...getBackgroundColor(), 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};

const getBackgroundColor = (): [number, number, number] => [0.7, 0.7, 0.7];

const objectData = (): { vertices: number[], indices: number[] } => {
  const vertices = [
    // X, Y, Z           R, G, B
		// Top
		-1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
		-1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
		1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
		1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

		// Left
		-1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
		-1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
		-1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
		-1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

		// Right
		1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
		1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
		1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
		1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

		// Front
		1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
		1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

		// Back
		1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
		1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

		// Bottom
		-1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
		-1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
		1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
		1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	];

	const indices = [
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
  ];
  
  return { vertices, indices };
};