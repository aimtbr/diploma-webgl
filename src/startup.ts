import PageController from './client/PageController';

import '../public/main.css';

window.onload = () => {
  const page = new PageController();
  page.init();
};
