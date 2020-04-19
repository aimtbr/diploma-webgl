import MainController from './client/MainController';

import '../public/main.css';

window.onload = () => {
  const controller = new MainController();
  controller.init();
};
