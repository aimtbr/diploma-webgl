import { mat4 } from "gl-matrix";
import Canvas from "./Canvas";

export default class CanvasController {
  private clicked: boolean = false;
  private cursorPosition: { x: number, y: number } = { x: 0, y: 0 };
  private tiltAngle: { x: number, y: number } = { x: 0, y: 0 };
  private canvas!: HTMLCanvasElement;
	private gl!: WebGLRenderingContext;
	private program!: WebGLProgram;

  constructor (self: Canvas) {
    try {
      this.program = self.program as WebGLProgram;
      this.gl = self.gl as WebGLRenderingContext;
      this.canvas = self.canvas as HTMLCanvasElement;

      this.enableZoom = this.enableZoom.bind(this);
      this.enableRotation = this.enableRotation.bind(this);
    } catch (error) {
      console.error(`Error occurred while initializing the CanvasController: ${error}`);
    }
  }

  enableZoom (zoomStep = 0.71, minDistance = -5, maxDistance = -30): void {
    this.canvas.onwheel = (event: WheelEvent): void | boolean => {
      event.preventDefault();
  
      const matViewUniformLocation = this.gl.getUniformLocation(this.program, 'matView');
  
      if (matViewUniformLocation === null) {
        console.error('Unable to locate the view matrix');
        return false;
      }
  
      const viewMatrix = this.gl.getUniform(this.program, matViewUniformLocation);
      const eyeDistanceZ = viewMatrix[14];
  
      // zoom in if scroll up and vice versa if not too close or not to far
      viewMatrix[14] += event.deltaY < 0 ?
        (eyeDistanceZ < minDistance ? zoomStep : 0.0) :
        (eyeDistanceZ > maxDistance ? -zoomStep : 0.0);
  
      this.gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix); // save changes in GPU
    }
  }

  enableRotation (): void {
    // signals that user is trying to rotate an object
    this.canvas.onmousedown = (event: MouseEvent): void => {
      this.clicked = true;
      this.cursorPosition = { x: event.clientX, y: event.clientY };
    };

    // signals that user is no longer trying to rotate an object 
    this.canvas.onmouseup = (): void => {
      this.clicked = false;
    };

    this.canvas.onmousemove = (event: MouseEvent): void => {
      if (this.clicked) {
        let { x: angleX, y: angleY } = this.tiltAngle;
        const { clientX, clientY } = event;
        const { x: cursorX, y: cursorY } = this.cursorPosition;

        this.tiltAngle.x = angleX + ((clientX >= cursorX ? 1 : -1) * Math.abs(clientX - cursorX) / 200);
        this.tiltAngle.y = angleY + ((clientY >= cursorY ? 1 : -1) * Math.abs(clientY - cursorY) / 200);
        this.cursorPosition = { x: clientX, y: clientY };

        const matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'matWorld');

        if (matWorldUniformLocation === null) {
          console.error('Something went wrong while enabling the rotation feature');
          return;
        }

        let worldMatrix = this.gl.getUniform(this.program, matWorldUniformLocation);
        let xRotationMatrix = new Float32Array(16);
        let yRotationMatrix = new Float32Array(16);
        let identityMatrix = new Float32Array(16);

        mat4.identity(identityMatrix);

        mat4.rotate(yRotationMatrix, identityMatrix, angleX, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angleY, [1, 0, 0]);
        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);

        this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
      }
    };
  }
}