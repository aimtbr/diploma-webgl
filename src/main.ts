export const initCanvas = (): void => {
  console.log('Canvas initialization...');

  const canvas = document.getElementById('root-canvas') as HTMLCanvasElement | null;

  if (canvas === null) {
    alert('Canvas was not loaded, please try to restart the page');
    return;
  }

  const glContext: ReturnType<typeof canvas.getContext> = canvas.getContext('webgl')
    || canvas.getContext('experimental-webgl');

  if (glContext === null) {
    alert('Your browser does not support WebGL!');
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if ('viewport' in glContext) {
    glContext.viewport(0, 0, canvas.width, canvas.height);
  }
};

