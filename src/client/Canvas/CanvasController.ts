import { mat4, vec3 } from "gl-matrix";
import Canvas, { ObjectData } from "./Canvas";

export default class CanvasController {
  private clicked: boolean = false;
  private cursorPosition: { x: number, y: number } = { x: 0, y: 0 };
  private tiltAngle: { x: number, y: number } = { x: 0, y: 0 };
  // private canvas!: HTMLCanvasElement;
	// private gl!: WebGLRenderingContext;
  // private program!: WebGLProgram;
  readonly canvasInstance: Canvas;

  constructor (canvasInstance: Canvas) {
    this.canvasInstance = canvasInstance;

    try {
      // this.program = self.program as WebGLProgram;
      // this.gl = self.gl as WebGLRenderingContext;
      // this.canvas = self.canvas as HTMLCanvasElement;

      this.bindMethods.apply(this);
    } catch (error) {
      console.error(`Error occurred while initializing the CanvasController: ${error}`);
    }
  }

  bindMethods (this: CanvasController) {
    this.enableZoom = this.enableZoom.bind(this);
    this.enableRotation = this.enableRotation.bind(this);
    this.enableLighting = this.enableLighting.bind(this);
    this.generateNormals = this.generateNormals.bind(this);
  }

  async enableZoom (zoomStep = 0.71, minDistance = -10, maxDistance = -30): Promise<void> {
    try {
      const { canvas, program, gl } = this.canvasInstance;

      if (canvas === null || program === null || gl === null) {
        throw new Error('One of the required properties is null');
      }

      canvas.onwheel = (event: WheelEvent): void | boolean => {
        event.preventDefault();
    
        const matViewUniformLocation = gl.getUniformLocation(program, 'matView');
    
        if (matViewUniformLocation === null) {
          console.error('Unable to locate the view matrix');
          return false;
        }
    
        const viewMatrix = gl.getUniform(program, matViewUniformLocation);
        const eyeDistanceZ = viewMatrix[14];
    
        // zoom in if scroll up and vice versa if not too close or not to far
        viewMatrix[14] += event.deltaY < 0 ?
          (eyeDistanceZ < minDistance ? zoomStep : 0.0) :
          (eyeDistanceZ > maxDistance ? -zoomStep : 0.0);
    
        gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix); // save changes in GPU
      }
    } catch (error) {
      console.error(error);
    }
  }

  async enableRotation (): Promise<void> {
    try {
      const { canvas, program, gl } = this.canvasInstance;

      if (canvas === null || program === null || gl === null) {
        throw new Error('One of the required properties is null');
      }

      // signals that user is trying to rotate an object
      canvas.onmousedown = (event: MouseEvent): void => {
        this.clicked = true;
        this.cursorPosition = { x: event.clientX, y: event.clientY };
      };

      // signals that user is no longer trying to rotate an object 
      canvas.onmouseup = (): void => {
        this.clicked = false;
      };

      canvas.onmousemove = (event: MouseEvent): void => {
        if (this.clicked) {
          let { x: angleX, y: angleY } = this.tiltAngle;
          const { clientX, clientY } = event;
          const { x: cursorX, y: cursorY } = this.cursorPosition;

          this.tiltAngle.x = angleX + ((clientX >= cursorX ? 1 : -1) * Math.abs(clientX - cursorX) / 200);
          this.tiltAngle.y = angleY + ((clientY >= cursorY ? 1 : -1) * Math.abs(clientY - cursorY) / 200);
          this.cursorPosition = { x: clientX, y: clientY };

          const matWorldUniformLocation = gl.getUniformLocation(program, 'matWorld');

          if (matWorldUniformLocation === null) {
            console.error('Something went wrong while enabling the rotation feature');
            return;
          }

          let worldMatrix = gl.getUniform(program, matWorldUniformLocation);
          let xRotationMatrix = new Float32Array(16);
          let yRotationMatrix = new Float32Array(16);
          let identityMatrix = new Float32Array(16);

          mat4.identity(identityMatrix);

          mat4.rotate(yRotationMatrix, identityMatrix, angleX, [0, 1, 0]);
          mat4.rotate(xRotationMatrix, identityMatrix, angleY, [1, 0, 0]);
          mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);

          gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
        }
      };
    } catch (error) {
      console.error(error);
    }
  }

  async enableLighting (): Promise<void> {
    try {
      const { objectData, gl, programInfo } = this.canvasInstance;

      if (objectData === null || gl === null || programInfo === null) {
        throw new Error('One of the required properties is null');
      }

      const { vertNormal: vertNormalLocation } = programInfo.attribLocations;
      const {
        ambientLightIntensity: ambientLightIntensityUL,
        sunlightIntensity: sunlightIntensityUL,
        sunlightDirection: sunlightDirectionUL,
      } = programInfo.uniformLocations;

      const ambientLightIntensity = [0.1, 0.1, 0.3];
      const sunlightIntensity = [1, 1, 1];
      const sunlightDirection = new Float32Array([-1.5, 1.75, -3]); // type cast of number[] to Float32Array
      let normalizedSunlightDirection = vec3.normalize(new Float32Array(3), sunlightDirection);

      const vertexNormals = this.generateNormals(objectData);

      if (vertexNormals === null) {
        throw new Error('Couldn\'t generate the normals for an object, lighting feature is disabled!')
      }

      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
      gl.vertexAttribPointer(
				vertNormalLocation, // Attribute location
				3, // Number of elements per attribute
				gl.FLOAT, // Type of elements
				true,
				3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
				0 // Offset from the beginning of a single vertex to this attribute
			);
      gl.enableVertexAttribArray(vertNormalLocation);

      // pass the lighting configuration to a shader
      gl.uniform3fv(ambientLightIntensityUL, ambientLightIntensity);
      gl.uniform3fv(sunlightIntensityUL, sunlightIntensity);
      gl.uniform3fv(sunlightDirectionUL, normalizedSunlightDirection);
    } catch (error) {
      console.error(error);
    }
  }

  private generateNormals (objectData: ObjectData): number[] | null {
    try {
      // TO BE IMPLEMENTED
      const normals = [
        // Top
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
    
        // Right
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
    
        // Back
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Bottom
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
      ];

      return normals;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}