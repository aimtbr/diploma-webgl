import PageController from './client/PageController';

import '../public/main.css';

window.onload = () => {
  const controller = new PageController();
  controller.init();
};
