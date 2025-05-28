const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const db = require('./backend/dist/backend/database.js');
const { generateResearchKeywordsFromTopic, generateResearchQuestionsFromTopic, generateProjectOutline, generateSectionParagraph } = require('./backend/dist/backend/ai_client/index.js');
const searchClient = require('./backend/dist/backend/search_client/index.js');
const helpers = require('./backend/dist/backend/utils/helpers.js');

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

ipcMain.handle('searchRetrievers:search', async (event, { retriever, project_uid, project_title, queries }) => {
  // For now, use processSearch with queries and default options
  // Optionally, you could use retriever.slug to select a specific retriever
  return await searchClient.getScientificPapers(project_uid, project_title, queries, { retriever });
});

ipcMain.handle('literature:saveResults', async (event, { projectId, results }) => {
  return await db.saveLiteratureResults(projectId, results);
});

ipcMain.handle('literature:getResults', async (event, { projectId }) => {
  return await db.getLiteratureResults(projectId);
});

ipcMain.handle('literature:export', async (event, { format, papers }) => {
  return await helpers.exportLiteratureFile(format, papers);
});

ipcMain.handle('literature:addPaper', async (event, { projectId, paper }) => {
  return await db.addPaperToProject(projectId, paper);
});

ipcMain.handle('literature:updatePaper', async (event, { paper }) => {
  return await db.updatePaper(paper);
});

ipcMain.handle('literature:deletePaper', async (event, { paperId }) => {
  return await db.deletePaper(paperId); // This should be db.deleteResource now, but depends on previous task completion.
});

// --- Resource IPC Handlers ---
ipcMain.handle('resources:showOpenDialog', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      // You might want to add filters for specific file types, e.g.:
      // filters: [
      //   { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
      //   { name: 'All Files', extensions: ['*'] },
      // ],
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      console.log('[resources:showOpenDialog] Dialog canceled or no files selected.');
      return undefined;
    }
    console.log('[resources:showOpenDialog] Files selected:', filePaths);
    return filePaths;
  } catch (error) {
    console.error('[resources:showOpenDialog] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resources:add', async (event, projectId, resourceData) => {
  console.log('[resources:add] Received projectId:', projectId, 'resourceData:', resourceData);
  try {
    // The db.addResourceToProject function should handle UID generation if not provided.
    // It expects a research_paper like object.
    const resource = {
      // uid: resourceData.uid || db.generateUID(), // generateUID is on researchProject.js, db.addResourceToProject handles it
      title: resourceData.title,
      url: resourceData.urlOrPath, // urlOrPath from frontend maps to url in DB
      summary: resourceData.summary,
      author: resourceData.author,
      publishedDate: resourceData.publishedDate, // Needs to be ISO string or null
      score: resourceData.score,
      sourceQuery: resourceData.sourceQuery,
      index: resourceData.index,
      // type: resourceData.type, // Not storing type in DB as per previous task
    };
    const result = await db.addResourceToProject(projectId, resource);
    console.log('[resources:add] Result from DB:', result);
    return result;
  } catch (error) {
    console.error('[resources:add] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resources:list', async (event, projectId) => {
  console.log('[resources:list] Fetching resources for projectId:', projectId);
  try {
    const resources = await db.getResourcesForProject(projectId);
    console.log('[resources:list] Resources from DB:', resources.length);
    return resources;
  } catch (error) {
    console.error('[resources:list] Error:', error);
    return []; // Return empty array or error object
  }
});

ipcMain.handle('resources:update', async (event, resourceData) => {
  console.log('[resources:update] Updating resource:', resourceData);
  try {
    const result = await db.updateResource(resourceData);
    console.log('[resources:update] Result from DB:', result);
    return result;
  } catch (error) {
    console.error('[resources:update] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resources:delete', async (event, resourceId) => {
  console.log('[resources:delete] Deleting resource with ID:', resourceId);
  try {
    const result = await db.deleteResource(resourceId);
    console.log('[resources:delete] Result from DB:', result);
    return result;
  } catch (error) {
    console.error('[resources:delete] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resources:openExternal', async (event, urlOrPath) => {
  console.log('[resources:openExternal] Opening:', urlOrPath);
  try {
    if (urlOrPath.startsWith('http:') || urlOrPath.startsWith('https:')) {
      await shell.openExternal(urlOrPath);
    } else {
      // For local files, shell.openPath might be more appropriate
      // or shell.showItemInFolder to reveal it.
      // shell.openPath can execute files, so be cautious.
      // For simply opening a file with its default app, openExternal can often handle file:// paths too.
      // If openPath is preferred for local files:
      // await shell.openPath(path.normalize(urlOrPath));
      // Using openExternal for file paths (file:// protocol) can also work on some systems.
      // Let's try openExternal first as it's generally safer.
      if (path.isAbsolute(urlOrPath)) {
         await shell.openPath(urlOrPath); // Use openPath for absolute local file paths
      } else if (urlOrPath.startsWith('file://')) {
         await shell.openExternal(urlOrPath); // For explicit file URLs
      } else {
        // Fallback or error for unclear paths
        console.warn('[resources:openExternal] Path is not a URL and not absolute, attempting openExternal:', urlOrPath);
        await shell.openExternal(urlOrPath);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[resources:openExternal] Error opening:', urlOrPath, error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('researchDrafts:list', async (event, { projectId }) => {
  return await db.getAllResearchDrafts(projectId);
});

ipcMain.handle('researchDrafts:add', async (event, draft) => {
  return await db.addResearchDraftToProject(draft);
});

ipcMain.handle('researchDrafts:getDraft', async (event, { draftId }) => {
  return await db.getResearchDraft(draftId);
});

ipcMain.handle('researchDrafts:update', async (event, draft) => {
  return await db.updateResearchDraft(draft);
});

ipcMain.handle('researchDrafts:updateReport', async (event, draft) => {
  try {
    if (!draft || !draft.uid || !draft.report) {
      throw new Error('Invalid draft data: missing required fields');
    }

    // Validate report size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (draft.report.length > maxSize) {
      throw new Error('Report size exceeds maximum limit of 10MB');
    }

    const result = await db.updateResearchDraftReport(draft);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update draft report');
    }
    return result;
  } catch (error) {
    console.error('[researchDrafts:updateReport] Error:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred while updating the draft report'
    };
  }
});

ipcMain.handle('researchDrafts:generateOutline', async (event, { topic, language }) => {
  return await generateProjectOutline(topic, language);
});

ipcMain.handle('researchDrafts:generateSubsectionContent', async (event, { projectId, topic, sectionTitle, subsectionTitle, language }) => {
  return await generateSectionParagraph(projectId, topic, sectionTitle, subsectionTitle, language);
});

ipcMain.handle('researchDrafts:delete', async (event, { draftId }) => {
  return await db.deleteResearchDraft(draftId);
});

ipcMain.handle('researchDrafts:exportReport', async (event, { uid, format }) => {
  return await helpers.exportDraftReportHelper(uid, format);
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
      // console.log('Attempting to open DevTools...');
      // mainWindow.webContents.openDevTools();
      // console.log('Called openDevTools.'); // Log call attempt
    })
    .catch(err => {
      console.log('Failed to load URL:', startUrl, err); // Log loading error
    });

  // LogwebContents existence
  if (mainWindow && mainWindow.webContents) {
      console.log('webContents object exists.');
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.log(`webContents failed to load URL: ${validatedURL}. Error ${errorCode}: ${errorDescription}`);
      });
      mainWindow.webContents.on('crashed', (event, killed) => {
          console.log(`webContents crashed! Killed: ${killed}`);
      });
      mainWindow.webContents.on('render-process-gone', (event, details) => {
          console.log(`webContents render process gone! Reason: ${details.reason}`);
      });
  } else {
      console.log('mainWindow or mainWindow.webContents is not available before loading URL.');
  }

  // Optional: Open DevTools immediately (less ideal but for debugging)
  console.log('Attempting to open DevTools immediately...');
  mainWindow.webContents.openDevTools();
  console.log('Called openDevTools immediately.');
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