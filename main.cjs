const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./backend/dist/backend/database.js');
const { generateResearchKeywordsFromTopic, generateResearchQuestionsFromTopic } = require('./backend/dist/backend/ai_client/index.js');
const searchClient = require('./backend/dist/backend/search_client/index.js');

console.log('Main process script started.'); // Log start

// IPC handlers for CRUD operations
ipcMain.handle('researchProjects:list', async () => {
  return await db.listResearchProjects();
});

ipcMain.handle('researchProjects:create', async (event, project) => {
  console.log('[researchProjects:create] Received project:', project);
  return await db.createResearchProject(project);
});

ipcMain.handle('researchProjects:get', async (event, uid) => {
  console.log('[researchProjects:get] Fetching project with uid:', uid);
  return await db.getResearchProject(uid);
});

ipcMain.handle('researchProjects:update', async (event, project) => {
  console.log('[researchProjects:update] Updating project:', project);
  return await db.updateResearchProject(project);
});

// User meta data handlers
ipcMain.handle('userMetaData:getAll', async () => {
  return await db.getAllUserMetaData();
});

ipcMain.handle('userMetaData:get', async (event, key) => {
  return await db.getUserMetaData(key);
});

ipcMain.handle('userMetaData:set', async (event, { key, value, type }) => {
  return await db.setUserMetaData(key, value, type);
});

ipcMain.handle('userMetaData:getByRef', async (event, ref) => {
  return await db.getUserMetaDataByRef(ref);
});

ipcMain.handle('aiAgents:list', async () => {
  return await db.listAIAgents();
});

ipcMain.handle('aiAgents:update', async (event, agent) => {
  return await db.updateAIAgent(agent);
});

ipcMain.handle('aiAgents:generateResearchKeywordsFromTopic', async (event, topic) => {
  return await generateResearchKeywordsFromTopic(topic);
});

ipcMain.handle('aiAgents:generateResearchQuestionsFromTopic', async (event, topic) => {
  return await generateResearchQuestionsFromTopic(topic);
});

// --- Search Retrievers IPC handlers ---
ipcMain.handle('searchRetrievers:list', async () => {
  return await db.listSearchRetrievers();
});

ipcMain.handle('searchRetrievers:update', async (event, retriever) => {
  return await db.updateSearchRetriever(retriever);
});

ipcMain.handle('searchRetrievers:search', async (event, { retriever, project_uid, queries }) => {
  // For now, use processSearch with queries and default options
  // Optionally, you could use retriever.slug to select a specific retriever
  return await searchClient.getScientificPapers(project_uid, queries, { retriever });
});

ipcMain.handle('literature:saveResults', async (event, { projectId, results }) => {
  return await db.saveLiteratureResults(projectId, results);
});

ipcMain.handle('literature:getResults', async (event, { projectId }) => {
  return await db.getLiteratureResults(projectId);
});

function createWindow() {
  console.log('createWindow function called.'); // Log function entry

  // Create the browser window.
  console.log('Creating BrowserWindow...');
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    webPreferences: {
      nodeIntegration: false, // Keep Node integration off for security
      contextIsolation: true, // Protect against prototype pollution
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/icons/png/rwiz.png'),
    // titleBarStyle: 'hidden',
    titleBarOverlay:{
      color: '#263238',
      symbolColor: '#546E7A',
      height: 30
    }
  });
  console.log('BrowserWindow created:', !!mainWindow); // Log window creation success

  // Determine the path to load
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  console.log('Attempting to load URL:', startUrl); // Log URL

  // Load the index.html of the app.
  mainWindow.loadURL(startUrl)
    .then(() => {
      console.log('URL successfully loaded:', startUrl); // Log successful load
      // Try opening DevTools *after* the URL promise resolves
      console.log('Attempting to open DevTools...');
      mainWindow.webContents.openDevTools();
      console.log('Called openDevTools.'); // Log call attempt
    })
    .catch(err => {
      console.error('Failed to load URL:', startUrl, err); // Log loading error
    });

  // LogwebContents existence
  if (mainWindow && mainWindow.webContents) {
      console.log('webContents object exists.');
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.error(`webContents failed to load URL: ${validatedURL}. Error ${errorCode}: ${errorDescription}`);
      });
      mainWindow.webContents.on('crashed', (event, killed) => {
          console.error(`webContents crashed! Killed: ${killed}`);
      });
      mainWindow.webContents.on('render-process-gone', (event, details) => {
          console.error(`webContents render process gone! Reason: ${details.reason}`);
      });
  } else {
      console.error('mainWindow or mainWindow.webContents is not available before loading URL.');
  }

  // Optional: Open DevTools immediately (less ideal but for debugging)
  // console.log('Attempting to open DevTools immediately...');
  // mainWindow.webContents.openDevTools();
  // console.log('Called openDevTools immediately.');
}

console.log('Setting up app event listeners...');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await db.initializeTables(); // Make sure this is awaited if it returns a Promise
  console.log('App is ready.'); // Log when ready
  createWindow();

  app.on('activate', () => {
    console.log('App activate event triggered.');
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        console.log('No windows open, calling createWindow again.');
        createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  console.log('Window-all-closed event triggered.');
  if (process.platform !== 'darwin') {
    console.log('Quitting app (not macOS).');
    app.quit();
  } else {
    console.log('Not quitting app (macOS).');
  }
});

console.log('Main process script finished initial execution.'); // Log end of script

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.