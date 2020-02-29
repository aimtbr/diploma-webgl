export const initCanvas = (): void => {
  console.log('Canvas initialization...');

  const canvas = document.getElementById('root-canvas') as HTMLCanvasElement | null;

  if (canvas === null) {
    alert('Canvas was not loaded, please try to restart the page');
    return;
  }

  const gl = canvas.getContext('webgl')
    || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

  if (gl === null) {
    alert('Your browser does not support WebGL!');
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if ('viewport' in gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  gl.clearColor(1.0, 0.75, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

