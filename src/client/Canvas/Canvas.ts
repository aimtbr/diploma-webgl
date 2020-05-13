import { glMatrix, mat4 } from 'gl-matrix';

import CanvasController from './CanvasController';


export interface ObjectData {
	// numOfTrianglesPerElement: number, // TEMP
	// numberOfVertices: number,
	vertices: number[],
	// numberOfElements: number,
	// elementsIndices: number[],
	// numberOfOuterTriangles: number,
	outerTrianglesIndices: number[],
	colors: number[],
};

interface ProgramInfo {
	attribLocations: {
		[key: string]: number;
	};
	uniformLocations: {
		[key: string]: WebGLUniformLocation | null;
	};
};

export default class Canvas {
	readonly id: string;
	private backgroundColor: [number, number, number];
	canvas: HTMLCanvasElement | null = null; // ADD METHODS THAT RETURN THE PRIVATE FIELDS LIKE THIS (MAKE IT PRIVATE)
	gl: WebGLRenderingContext | null = null;
	program: WebGLProgram | null = null;
	objectData: ObjectData | null = null;
	programInfo: ProgramInfo = {
		attribLocations: {},
		uniformLocations: {},
	};

	constructor (id: string) {
		this.id = id;
		this.backgroundColor = [0.7, 0.7, 0.7];

		this.objectData = {
			vertices: [
				// X, Y, Z
				// Top
				-1.0, 1.0, -1.0,
				-1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, -1.0,

				// Left
				-1.0, 1.0, 1.0,
				-1.0, -1.0, 1.0,
				-1.0, -1.0, -1.0,
				-1.0, 1.0, -1.0,

				// Right
				1.0, 1.0, 1.0,
				1.0, -1.0, 1.0,
				1.0, -1.0, -1.0,
				1.0, 1.0, -1.0,

				// Front
				1.0, 1.0, 1.0,
				1.0, -1.0, 1.0,
				-1.0, -1.0, 1.0,
				-1.0, 1.0, 1.0,

				// Back
				1.0, 1.0, -1.0,
				1.0, -1.0, -1.0,
				-1.0, -1.0, -1.0,
				-1.0, 1.0, -1.0,

				// Bottom
				-1.0, -1.0, -1.0,
				-1.0, -1.0, 1.0,
				1.0, -1.0, 1.0,
				1.0, -1.0, -1.0,
			],
			outerTrianglesIndices: [
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
			],
			colors: [
				// Top
				0.5, 0.5, 0.5,
				0.5, 0.5, 0.5,
				0.5, 0.5, 0.5,
				0.5, 0.5, 0.5,

				// Left
				0.75, 0.25, 0.5,
				0.75, 0.25, 0.5,
				0.75, 0.25, 0.5,
				0.75, 0.25, 0.5,
		
				// Right
				0.25, 0.25, 0.75,
				0.25, 0.25, 0.75,
				0.25, 0.25, 0.75,
				0.25, 0.25, 0.75,

				// Front
				1.0, 0.0, 0.15,
				1.0, 0.0, 0.15,
				1.0, 0.0, 0.15,
				1.0, 0.0, 0.15,

				// Back
				0.0, 1.0, 0.15,
				0.0, 1.0, 0.15,
				0.0, 1.0, 0.15,
				0.0, 1.0, 0.15,

				// Bottom
				0.5, 0.5, 1.0,
				0.5, 0.5, 1.0,
				0.5, 0.5, 1.0,
				0.5, 0.5, 1.0,
			]
		};

		this.bindMethods.apply(this);
	}

	protected bindMethods (this: Canvas) {
		this.init = this.init.bind(this);
		this.initCanvas = this.initCanvas.bind(this);
		this.initProgram = this.initProgram.bind(this);
		this.bindObjectData = this.bindObjectData.bind(this);
		this.setView = this.setView.bind(this);
		this.startDrawLoop = this.startDrawLoop.bind(this);
		this.setObjectData = this.setObjectData.bind(this);
		this.writeProgramInfo = this.writeProgramInfo.bind(this);
	}

	// protected init (): void {
	init (): void {
		try {
			this.initCanvas();
			this.initProgram();
			this.writeProgramInfo();
			this.bindObjectData();
			this.setView();
			this.startDrawLoop();

			const controller = new CanvasController(this);
			controller.enableZoom();
			controller.enableRotation();
			controller.enableLighting();
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
				attribute vec3 vertNormal;

				varying vec3 fragColor;
				varying vec3 fragNormal;

				uniform mat4 matWorld;
				uniform mat4 matView;
				uniform mat4 matProjection;
		
				void main()
				{
					fragNormal = (matWorld * vec4(vertNormal, 0.0)).xyz;
					fragColor = vertColor;

					gl_Position = matProjection * matView * matWorld * vec4(vertPosition, 1.0);
				}
			`;
		
			const fragmentShaderCode = `
				precision mediump float;
		
				varying vec3 fragColor;
				varying vec3 fragNormal;

				uniform vec3 ambientLightIntensity;
				uniform vec3 sunlightIntensity;
				uniform vec3 sunlightDirection;
		
				void main()
				{
					// vec3 ambientLightIntensity = vec3(0.1, 0.1, 0.3);
					// vec3 sunlightIntensity = vec3(1.0, 1.0, 1.0);
					// vec3 sunlightDirection = normalize(vec3(-1.5, 1.75, -3.0));
					// vec3 normalizedSunlightDirection = normalize(sunlightDirection);
					vec3 lighting = ambientLightIntensity + sunlightIntensity * max(dot(fragNormal, sunlightDirection), 0.0);

					gl_FragColor = vec4(lighting, 1.0);
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
				throw new Error(`Error occurred while linking the program: ${this.gl.getProgramInfoLog(this.program)}`);
			}

			this.gl.validateProgram(this.program);
			if (!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)) {
				throw new Error(`Error occurred while validating the program: ${this.gl.getProgramInfoLog(this.program)}`);
			}

			// Tell OpenGL state machine which program should be active.
			this.gl.useProgram(this.program);
		} catch (error) {
			console.error(error);

			throw error;
		}
	}

	protected bindObjectData (): void {
		try {
			if (this.gl === null || this.objectData === null || this.program === null) {
				throw new Error('Error occurred while trying to bind the object data');
			}

			const { vertices, outerTrianglesIndices: indices } = this.objectData;
			const {
				vertPosition: vertPositionLocation,
				// vertColor: colorAttribLocation,
			} = this.programInfo.attribLocations;

			const vertexBufferObject = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBufferObject);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

			const indexBufferObject = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

			this.gl.vertexAttribPointer(
				vertPositionLocation, // Attribute location
				3, // Number of elements per attribute
				this.gl.FLOAT, // Type of elements
				false,
				3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
				0 // Offset from the beginning of a single vertex to this attribute
			);

			// const colorsBufferObject = this.gl.createBuffer();
			// this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBufferObject);
			// this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

			// this.gl.vertexAttribPointer(
			// 	colorAttribLocation,
			// 	3,
			// 	this.gl.FLOAT,
			// 	false,
			// 	6 * Float32Array.BYTES_PER_ELEMENT,
			// 	3 * Float32Array.BYTES_PER_ELEMENT,
			// );

			// PASS AN EMPTY COLORS ARRAY TO vertColor attribute in a shader

			this.gl.enableVertexAttribArray(vertPositionLocation);
			// this.gl.enableVertexAttribArray(colorAttribLocation);
		} catch (error) {
			throw error;
		}
	}
	
	protected setView (): void {
		try {
			if (this.canvas === null || this.gl === null || this.program === null) {
				throw new Error('Error occurred while trying to set the view');
			}
			const {
				matWorld: matWorldUniformLocation,
				matView: matViewUniformLocation,
				matProjection: matProjectionUniformLocation,
			} = this.programInfo.uniformLocations;

			let worldMatrix = new Float32Array(16);
			let viewMatrix = new Float32Array(16);
			let projectionMatrix = new Float32Array(16);

			mat4.identity(worldMatrix);
			mat4.lookAt(viewMatrix, [-3, 2, -10], [0, 0, 0], [0, 1, 0]);
			mat4.perspective(projectionMatrix, glMatrix.toRadian(45), this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000.0);
		
			this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
			this.gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
			this.gl.uniformMatrix4fv(matProjectionUniformLocation, false, projectionMatrix);
		} catch (error) {
			throw error;
		}
	}

	protected startDrawLoop (): void {
    try {
      if (this.gl === null || this.program === null || this.objectData === null) {
        throw new Error('Error occurred while trying to draw an object');
			}

			const {
				DEPTH_BUFFER_BIT,
				COLOR_BUFFER_BIT,
				UNSIGNED_SHORT,
				TRIANGLES,
			} = this.gl;
			const { outerTrianglesIndices: indices } = this.objectData;

      const draw = () => {
        this.gl!.clearColor(...this.backgroundColor, 1.0);
        this.gl!.clear(DEPTH_BUFFER_BIT | COLOR_BUFFER_BIT);
				this.gl!.drawElements(TRIANGLES, indices.length, UNSIGNED_SHORT, 0);

				requestAnimationFrame(draw);
			};

      requestAnimationFrame(draw);
    } catch (error) {
      throw error;
    }
	}

	protected writeProgramInfo () {
		try {
			const { gl, program } = this;

			if (gl === null || program === null) {
				throw new Error('Some fields are missing while saving the program info');
			}

			this.programInfo.attribLocations = {
				vertPosition: gl.getAttribLocation(program, 'vertPosition'),
				vertNormal: gl.getAttribLocation(program, 'vertNormal'),
				vertColor: gl.getAttribLocation(program, 'vertColor'),
			};

			this.programInfo.uniformLocations = {
				ambientLightIntensity: gl.getUniformLocation(program, 'ambientLightIntensity'),
				sunlightIntensity: gl.getUniformLocation(program, 'sunlightIntensity'),
				sunlightDirection: gl.getUniformLocation(program, 'sunlightDirection'),
				matWorld: gl.getUniformLocation(program, 'matWorld'),
				matView: gl.getUniformLocation(program, 'matView'),
				matProjection: gl.getUniformLocation(program, 'matProjection'),
			};
		} catch (error) {
			const { message, stack } = error;
			console.error(`${message} [${stack}]`);
		}
	}
	
	// TEMPORARY DISABLED
	setObjectData (objectData: ObjectData): boolean | null {
		try {
			if (Object.keys(objectData).length) {
				this.objectData = objectData;
			}

			this.init();

			return true;
		} catch (error) {
			console.error(`${error.message}: [${error.stack}]`);

			return null;
		}
	}
}
