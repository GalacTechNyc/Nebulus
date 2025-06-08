import { app } from 'electron';
import { MainWindow } from './windows/MainWindow';

app.whenReady().then(() => {
  MainWindow.create();
  app.on('activate', () => {
    if (MainWindow.getWindowCount() === 0) {
      MainWindow.create();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});