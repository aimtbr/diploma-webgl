import { mat4 } from "gl-matrix";

export default class Controller {
  private clicked: boolean = false;
  private cursorPosition: { x: number, y: number } = { x: 0, y: 0 };
  private tiltAngle: { x: number, y: number } = { x: 0, y: 0 };
  // private backgroundColor: [number, number, number];
  private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	// private objectData: { vertices: number[], indices: number[] };

  constructor (program: WebGLProgram, gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    // this.objectData = objectData;
    this.program = program;
    this.gl = gl;
    this.canvas = canvas;
    // this.backgroundColor = backgroundColor;

    this.enableZoom = this.enableZoom.bind(this);
    this.enableRotation = this.enableRotation.bind(this);
    // this.startDrawLoop = this.startDrawLoop.bind(this);
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
  
      // console.log('CLICKED', this.clicked);
      // console.log('POSITIONS', this.cursorPosition.x, this.cursorPosition.y);
    };

    // signals that user is no longer trying to rotate an object 
    this.canvas.onmouseup = (): void => {
      this.clicked = false;

      // console.log('CLICKED 2', this.clicked);
    };


    this.canvas.onmousemove = (event: MouseEvent): void => {
      // console.log('CLICKED?', this.clicked);
      if (this.clicked) {
        // const rotate = () => {
          let { x: angleX, y: angleY } = this.tiltAngle;
          const { clientX, clientY } = event;
          const { x: cursorX, y: cursorY } = this.cursorPosition;
          // console.log('CLIENTX', clientX, 'CLIENTY', clientY);
  
          this.tiltAngle.x = angleX + ((clientX >= cursorX ? 1 : -1) * Math.abs(clientX - cursorX) / 200);
          this.tiltAngle.y = angleY + ((clientY >= cursorY ? 1 : -1) * Math.abs(clientY - cursorY) / 200);
  
          this.cursorPosition = { x: clientX, y: clientY };
  
          // console.log('X', positionDiffX, 'Y', positionDiffY);
          console.log('ANGLE X Y', angleX, angleY);
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
          // mat4.identity(worldMatrix);
          console.log('WORLD', worldMatrix);
          mat4.rotate(yRotationMatrix, identityMatrix, angleX, [0, 1, 0]); // FIND A WAY TO SAVE ROTATION MATRICES
          mat4.rotate(xRotationMatrix, identityMatrix, angleY, [1, 0, 0]);
          mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
          // console.log('1', worldMatrix);

          // this.drawObject(worldMatrix);

          this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
  
          // this.gl.clearColor(...this.backgroundColor, 1.0);
          // this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
          // this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
  
          // requestAnimationFrame(rotate);
        // };
        // requestAnimationFrame(rotate);
        // const { clientX, clientY } = event;
        // const { x, y } = this.cursorPosition;
        // const { indices } = this.objectData;
        // // console.log('CLIENTX', clientX, 'CLIENTY', clientY);
  
        // const positionDiffX = (clientX >= x ? 1 : -1) * Math.abs(clientX - x);
        // const positionDiffY = (clientY >= y ? 1 : -1) * Math.abs(clientY - y);
  
        // this.cursorPosition = { x: clientX, y: clientY };
  
        // // console.log('X', positionDiffX, 'Y', positionDiffY);
  
        // const matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'matWorld');
  
        // let worldMatrix = this.gl.getUniform(this.program, matWorldUniformLocation);
        // let xRotationMatrix = new Float32Array(16);
        // let yRotationMatrix = new Float32Array(16);
        // let identityMatrix = new Float32Array(16);
  
        // mat4.identity(identityMatrix);
        // // mat4.identity(worldMatrix);
  
        // mat4.rotate(yRotationMatrix, identityMatrix, positionDiffY, [0, 1, 0]);
        // mat4.rotate(xRotationMatrix, identityMatrix, positionDiffX, [1, 0, 0]);
        // mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        // console.log('1', worldMatrix);
        // this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
  
        // this.gl.clearColor(...this.backgroundColor, 1.0);
        // this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        // this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
      }
    };
  }
}