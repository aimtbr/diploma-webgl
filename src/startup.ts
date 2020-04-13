import Canvas from './client/Canvas';

import '../public/main.css';

window.onload = () => {
  const canvas = new Canvas('root-canvas');
  canvas.init();
};
