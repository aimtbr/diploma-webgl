import { initCanvas } from './client/main';
import { initHandlers } from './client/handlers';

import '../public/main.css';

window.onload = () => {
  const program = initCanvas();

  if (program !== null) {
    initHandlers(program);
  }
};
