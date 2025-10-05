import App from './App.js';

const initializeApp = async (): Promise<void> => {
  const app = new App();
  await app.initialize();
};

document.addEventListener('DOMContentLoaded', initializeApp);
