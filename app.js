import { app, BrowserWindow, ipcMain } from "electron";
import main from "./main.js";

let mainWindow;
let currentCancelController = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('./src/index.html');
}

app.whenReady().then(createWindow);

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler for starting scraping
ipcMain.handle('start-scraping', async (event, searchTerm) => {
  try {
    // Create new cancel controller for this operation
    currentCancelController = { cancelled: false };
    
    // Callback function progress updates
    const progressCallback = (progressData) => {
      event.sender.send('scraping-progress', progressData);
    };

    const result = await main(searchTerm, progressCallback, currentCancelController);
    
    // Clear the controller when done
    currentCancelController = null;
    
    return result;
  } catch (error) {
    currentCancelController = null;
    return { success: false, message: error.message };
  }
});

// IPC handler for cancelling scraping
ipcMain.handle('cancel-scraping', async (event) => {
  try {
    if (currentCancelController) {
      currentCancelController.cancelled = true;
      return { success: true, message: 'Cancellation requested' };
    } else {
      return { success: false, message: 'No active operation to cancel' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});