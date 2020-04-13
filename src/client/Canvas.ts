import { glMatrix, mat4 } from 'gl-matrix';

import {
	setWheelHandler,
	mouseDownHandler,
	mouseUpHandler,
	mouseOverHandler
} from './handlers';


// REWORK TO CLASS AND MAKE IT USE ONLY PARTICULAR EVENT HANDLERS 

export default class Canvas {
	readonly id: string;
	private backgroundColor: [number, number, number];
	private canvas: HTMLCanvasElement | null;
	private gl: WebGLRenderingContext | null;
	private program: WebGLProgram | null;
	private objectData: { vertices: number[], indices: number[] } | null;
	private clicked: boolean = false;
	private cursorPosition: { x: number, y: number } | undefined;

	constructor (id: string) {
		this.id = id;
		this.backgroundColor = [0.7, 0.7, 0.7];
		this.canvas = null;
		this.gl = null;
		this.program = null;
		// this.objectData = null;
		this.objectData = {
			vertices: [
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
			],
			indices: [
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
			]
		};

		this.init = this.init.bind(this);
		this.initCanvas = this.initCanvas.bind(this);
		this.initProgram = this.initProgram.bind(this);
		this.bindObjectData = this.bindObjectData.bind(this);
		this.setView = this.setView.bind(this);
		this.drawObject = this.drawObject.bind(this);
		this.attachEventHandlers = this.attachEventHandlers.bind(this);

		try {
			this.init();
			this.attachEventHandlers();
			this.showReadyMessage();
		} catch (error) {
			console.error(`${error.message}: [${error.stack}]`);
		}
	}

	protected attachEventHandlers (): void {
		try {
			if (this.canvas === null) {
				throw new Error('Canvas is not available');
			}

			this.canvas.onwheel = setWheelHandler.apply(this);
			this.canvas.onmousedown = mouseDownHandler.apply(this);
			this.canvas.onmouseup = mouseUpHandler.apply(this);
			this.canvas.onmousemove = mouseOverHandler.apply(this);
		} catch (error) {
			throw error;
		}
	}

	init (): void {
		try {
			this.initCanvas();
			this.initProgram();
			this.bindObjectData();
			this.setView();
			this.drawObject();
		} catch (error) {
			throw error;
		}
	}

	protected initCanvas (): void {
		try {
			this.canvas = document.getElementById(this.id) as HTMLCanvasElement | null;
			
			if (this.canvas === null) {
				throw new Error('Canvas was not loaded, please try to restart the page');
			}

			this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

			if (this.gl === null) {
				throw new Error('Your browser does not support WebGL');
			}

			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;

			if ('viewport' in this.gl) {
				this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
			}

			this.gl.clearColor(...this.backgroundColor, 1.0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			this.gl.enable(this.gl.DEPTH_TEST);
			this.gl.enable(this.gl.CULL_FACE);
			this.gl.frontFace(this.gl.CCW);
			this.gl.cullFace(this.gl.BACK);
		} catch (error) {
			throw error;
		}
	}

	protected initProgram (): void {
		try {
			if (this.gl === null) {
				throw new Error('WebGL has not been initialized');
			}
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

			const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER) as WebGLShader; // returns the webgl shader with specified type
			const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER) as WebGLShader;

			this.gl.shaderSource(vertexShader, vertexShaderCode); // write the source code of webgl shader into the shader 
			this.gl.shaderSource(fragmentShader, fragmentShaderCode);

			this.gl.compileShader(vertexShader); // compiles the GLSL source code of the shader into the binary data
			if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
				throw new Error(`Error occurred while compiling the vertex shader: ${this.gl.getShaderInfoLog(vertexShader)}`);
			}

			this.gl.compileShader(fragmentShader);
			if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
				throw new Error(`Error occurred while compiling the fragment shader: ${this.gl.getShaderInfoLog(fragmentShader)}`);
			}

			this.program = this.gl.createProgram() as WebGLProgram; // creates and initializes the webgl program 
			this.gl.attachShader(this.program, vertexShader); // attaches the shader to webgl program
			this.gl.attachShader(this.program, fragmentShader);

			this.gl.linkProgram(this.program);
			if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
				throw new Error(`Error occurred while linking the this.program: ${this.gl.getProgramInfoLog(this.program)}`);
			}

			this.gl.validateProgram(this.program);
			if (!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)) {
				throw new Error(`Error occurred while validating the this.program: ${this.gl.getProgramInfoLog(this.program)}`);
			}

			// Tell OpenGL state machine which program should be active.
			this.gl.useProgram(this.program);
		} catch (error) {
			throw error;
		}
	}

	protected bindObjectData (): void {
		try {
			if (this.gl === null || this.objectData === null || this.program === null) {
				throw new Error('Error occurred while trying to bind the object data');
			}

			const { vertices, indices } = this.objectData;
			const positionAttribLocation = this.gl.getAttribLocation(this.program, 'vertPosition');
			const colorAttribLocation = this.gl.getAttribLocation(this.program, 'vertColor');
		
			const boxVertexBufferObject = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, boxVertexBufferObject);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		
			const boxIndexBufferObject = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
		
			this.gl.vertexAttribPointer(
				positionAttribLocation, // Attribute location
				3, // Number of elements per attribute
				this.gl.FLOAT, // Type of elements
				false,
				6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
				0 // Offset from the beginning of a single vertex to this attribute
			);
			this.gl.vertexAttribPointer(
				colorAttribLocation,
				3,
				this.gl.FLOAT,
				false,
				6 * Float32Array.BYTES_PER_ELEMENT,
				3 * Float32Array.BYTES_PER_ELEMENT
			);
		
			this.gl.enableVertexAttribArray(positionAttribLocation);
			this.gl.enableVertexAttribArray(colorAttribLocation);
		} catch (error) {
			throw error;
		}
	};
	
	protected setView (): void {
		try {
			if (this.canvas === null || this.gl === null || this.program === null) {
				throw new Error('Error occurred while trying to set the view');
			}

			const matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'matWorld');
			const matViewUniformLocation = this.gl.getUniformLocation(this.program, 'matView');
			const matProjectionUniformLocation = this.gl.getUniformLocation(this.program, 'matProjection');
		
			let worldMatrix = new Float32Array(16);
			let viewMatrix = new Float32Array(16);
			let projectionMatrix = new Float32Array(16);

			mat4.identity(worldMatrix);
			mat4.lookAt(viewMatrix, [-2, 2, -10], [0, 0, 0], [0, 1, 0]);
			mat4.perspective(projectionMatrix, glMatrix.toRadian(45), this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000.0);
		
			this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
			this.gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
			this.gl.uniformMatrix4fv(matProjectionUniformLocation, false, projectionMatrix);
		} catch (error) {
			throw error;
		}
	};
	
	protected drawObject (): void {
		if (this.gl === null || this.program === null || this.objectData === null) {
			throw new Error('Error occurred while trying to run the animation');
		}

		// let angle = 0;
		// let xRotationMatrix = new Float32Array(16);
		// let yRotationMatrix = new Float32Array(16);
		let worldMatrix = new Float32Array(16);
		// let identityMatrix = new Float32Array(16);
		const { indices } = this.objectData;
		const matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'matWorld');
	
		mat4.identity(worldMatrix);
		// mat4.identity(identityMatrix);
	
		const draw = () => {
			// angle = performance.now() / 1000 / 10 * 2 * Math.PI;
			// mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
			// mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
			// mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
			this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
	
			this.gl.clearColor(...this.backgroundColor, 1.0);
			this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
			this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);

			// requestAnimationFrame(loop);
		};
		requestAnimationFrame(draw);
	}

	protected showReadyMessage () {
		console.log('Canvas loaded successfully');
	}
}

// export const initCanvas = (): WebGLProgram | null => {
//   try {
//     console.log('Canvas initialization...');

//     const canvas = document.getElementById('root-canvas') as HTMLCanvasElement | null;

//     if (canvas === null) {
//       alert('Canvas was not loaded, please try to restart the page');
//       return null;
//     }

//     const gl = canvas.getContext('webgl')
//       || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

//     if (gl === null) {
//       alert('Your browser does not support WebGL');
//       return null;
//     }

//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;

//     if ('viewport' in gl) {
//       gl.viewport(0, 0, canvas.width, canvas.height);
//     }

//     gl.clearColor(...getBackgroundColor(), 1.0);
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     gl.enable(gl.DEPTH_TEST);
//     gl.enable(gl.CULL_FACE);
//     gl.frontFace(gl.CCW);
//     gl.cullFace(gl.BACK);

//     const program = initProgram(gl);
//     const data = objectData();

//     bindObjectData(data, gl, program);
//     setView(gl, program, canvas);
// 		runAnimation(gl, program);
		
// 		return program;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// };

// const initProgram = (gl: WebGLRenderingContext): WebGLProgram => {
//   // source code of the shader
//   const vertexShaderCode = `
//     precision mediump float;

//     attribute vec3 vertPosition;
//     attribute vec3 vertColor;
//     varying vec3 fragColor;
//     uniform mat4 matWorld;
//     uniform mat4 matView;
//     uniform mat4 matProjection;

//     void main()
//     {
//       fragColor = vertColor;
//       gl_Position = matProjection * matView * matWorld * vec4(vertPosition, 1.0);
//     }
//   `;

//   const fragmentShaderCode = `
//     precision mediump float;

//     varying vec3 fragColor;

//     void main()
//     {
//       gl_FragColor = vec4(fragColor, 1.0);
//     }
//   `;

//   const vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader; // returns the webgl shader with specified type
// 	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;

// 	gl.shaderSource(vertexShader, vertexShaderCode); // write the source code of webgl shader into the shader 
// 	gl.shaderSource(fragmentShader, fragmentShaderCode);

// 	gl.compileShader(vertexShader); // compiles the GLSL source code of the shader into the binary data
// 	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
// 		throw `Error occurred while compiling the vertex shader: ${gl.getShaderInfoLog(vertexShader)}`;
// 	}

// 	gl.compileShader(fragmentShader);
// 	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
// 		throw `Error occurred while compiling the fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`;
// 	}

// 	const program = gl.createProgram() as WebGLProgram; // creates and initializes the webgl program 
// 	gl.attachShader(program, vertexShader); // attaches the shader to webgl program
//   gl.attachShader(program, fragmentShader);
  
//   gl.linkProgram(program);
// 	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//     throw `Error occurred while linking the program: ${gl.getProgramInfoLog(program)}`;
//   }
  
//   gl.validateProgram(program);
// 	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
// 		throw `Error occurred while validating the program: ${gl.getProgramInfoLog(program)}`;
// 	}

// 	// Tell OpenGL state machine which program should be active.
// 	gl.useProgram(program);
  
//   return program;
// };

// const bindObjectData = (gl: WebGLRenderingContext, program: WebGLProgram): void => {
//   const { vertices, indices } = objectData;
//   const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
//   const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

//   const boxVertexBufferObject = gl.createBuffer();
// 	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
// 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// 	const boxIndexBufferObject = gl.createBuffer();
// 	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
// 	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
 
// 	gl.vertexAttribPointer(
// 		positionAttribLocation, // Attribute location
// 		3, // Number of elements per attribute
// 		gl.FLOAT, // Type of elements
// 		false,
// 		6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
// 		0 // Offset from the beginning of a single vertex to this attribute
// 	);
// 	gl.vertexAttribPointer(
// 		colorAttribLocation,
// 		3,
// 		gl.FLOAT,
// 		false,
// 		6 * Float32Array.BYTES_PER_ELEMENT,
// 		3 * Float32Array.BYTES_PER_ELEMENT
// 	);

// 	gl.enableVertexAttribArray(positionAttribLocation);
// 	gl.enableVertexAttribArray(colorAttribLocation);
// };

// const setView = (gl: WebGLRenderingContext, program: WebGLProgram, canvas: HTMLCanvasElement): void => {
//   const matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');
// 	const matViewUniformLocation = gl.getUniformLocation(program, 'matView');
// 	const matProjectionUniformLocation = gl.getUniformLocation(program, 'matProjection');

// 	let worldMatrix = new Float32Array(16);
// 	let viewMatrix = new Float32Array(16);
// 	let projectionMatrix = new Float32Array(16);
// 	mat4.identity(worldMatrix);
// 	mat4.lookAt(viewMatrix, [-2, 2, -10], [0, 0, 0], [0, 1, 0]);
// 	mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

// 	gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
// 	gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
//   gl.uniformMatrix4fv(matProjectionUniformLocation, false, projectionMatrix);
// };

// const runAnimation = function (gl: WebGLRenderingContext, program: WebGLProgram): void {
// 	// let angle = 0;
// 	// let xRotationMatrix = new Float32Array(16);
// 	// let yRotationMatrix = new Float32Array(16);
// 	let worldMatrix = new Float32Array(16);
//   let identityMatrix = new Float32Array(16);
//   const { indices } = objectData();
//   const matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');

// 	mat4.identity(worldMatrix);
//   mat4.identity(identityMatrix);

// 	const loop = function () {
// 		// angle = performance.now() / 1000 / 10 * 2 * Math.PI;
// 		// mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
// 		// mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
// 		// mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
// 		gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);

//     gl.clearColor(...getBackgroundColor(), 1.0);
// 		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
// 		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

// 		requestAnimationFrame(loop);
// 	};
// 	requestAnimationFrame(loop);
// };

// const getBackgroundColor = (): [number, number, number] => [0.7, 0.7, 0.7];

// const objectData = (): { vertices: number[], indices: number[] } => {
//   const vertices = [
//     // X, Y, Z           R, G, B
// 		// Top
// 		-1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
// 		-1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
// 		1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
// 		1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

// 		// Left
// 		-1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
// 		-1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
// 		-1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
// 		-1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

// 		// Right
// 		1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
// 		1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
// 		1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
// 		1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

// 		// Front
// 		1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
// 		1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
// 		-1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
// 		-1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

// 		// Back
// 		1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
// 		1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
// 		-1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
// 		-1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

// 		// Bottom
// 		-1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
// 		-1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
// 		1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
// 		1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
// 	];

// 	const indices = [
// 		// Top
// 		0, 1, 2,
// 		0, 2, 3,

// 		// Left
// 		5, 4, 6,
// 		6, 4, 7,

// 		// Right
// 		8, 9, 10,
// 		8, 10, 11,

// 		// Front
// 		13, 12, 14,
// 		15, 14, 12,

// 		// Back
// 		16, 17, 18,
// 		16, 18, 19,

// 		// Bottom
// 		21, 20, 22,
// 		22, 20, 23
//   ];
  
//   return { vertices, indices };
// };