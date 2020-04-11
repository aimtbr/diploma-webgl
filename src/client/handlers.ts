export const initHandlers = (program: WebGLProgram): void => {
  setWheelHandler(program);
};

const setWheelHandler = async (program: WebGLProgram): Promise<void> => {
  const canvas = document.getElementById('root-canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

  if (canvas === null || gl === null) {
    console.error('Error occurred while setting the wheel handler!');
    return;
  }
  // MOVE HANDLER IN ANOTHER FILE AND COLLECT THEM ALL IN THERE 
  // THEN JUST ATTACH THOSE HANDLERS TO CLASS
  canvas.onwheel = (event: WheelEvent): boolean | void => {
    event.preventDefault();
    const zoomStep = 0.71;
    const minDistance = -5;
    const maxDistance = -30;

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
  };
};