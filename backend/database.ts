import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { app } from 'electron';
import type { Resource } from '../src/lib/Resource';
import { ResearchDraft } from '../src/lib/researchDraft';
import { generateUID } from '../src/lib/researchProject';
import * as os from 'os';

// Path for the SQLite database file
// const dbPath = path.join(app.getPath('userData'), 'research_management.sqlite');
// Try to import app from electron, but fallback if not available
let userDataPath: string;
try {
  // Only works in Electron
  const { app } = require('electron');
  userDataPath = app.getPath('userData');
} catch (e) {
  // Fallback for Node.js/ts-node
  const homeDir = os.homedir();
  userDataPath = path.join(homeDir, '.config/research_wizard');// this is only valid for linux
  console.log('Fallback to home directory:', userDataPath);
}
const dbPath = path.join(userDataPath, 'research_management.sqlite');

// Ensure the directory exists
// fs.mkdirSync(app.getPath('userData'), { recursive: true });
fs.mkdirSync(userDataPath, { recursive: true });

// Open or create the database (serialized mode)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log('Failed to open database:', err);
  } else {
    console.log('Database opened at', dbPath);
  }
});

function initializeTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS research_projects (
          uid TEXT PRIMARY KEY UNIQUE,
          title TEXT NOT NULL,
          keywords TEXT,
          description TEXT,
          research_questions TEXT,
          status TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `, [], (err) => {
        if (err) return reject(err);
        db.run(`
          CREATE TABLE IF NOT EXISTS user_meta_data (
            Key TEXT PRIMARY KEY UNIQUE,
            Value TEXT,
            Type TEXT,
            ref TEXT,
            label TEXT,
            idx INTEGER
          );
        `, [], (err) => {
          if (err) return reject(err);
          db.run(`UPDATE user_meta_data SET ref='gen' WHERE ref IS NULL OR ref=''`);

          // Helper to generate label from key
          function makeLabel(key: string) {
            if (!key) return '';
            const s = key.replace(/_/g, ' ').toLowerCase();
            return s.charAt(0).toUpperCase() + s.slice(1);
          }

          // Load default_params.json and insert AI_AGENT_PARAMS and RESEARCH_PARAMS
          const paramsPath = path.join(__dirname, 'default_settings', 'default_params.json');
          fs.readFile(paramsPath, 'utf8', (err, data) => {
            if (err) return;
            let params: {
              AI_AGENT_PARAMS?: Record<string, { value: any, index: number }>;
              RESEARCH_PARAMS?: Record<string, { value: any, index: number }>;
            };
            try {
              params = JSON.parse(data);
            } catch (e) { return; }
            // AI_AGENT_PARAMS
            if (params.AI_AGENT_PARAMS) {
              Object.entries(params.AI_AGENT_PARAMS).forEach(([key, valueObj]) => {
                const label = makeLabel(key);
                const value = valueObj.value;
                db.run(
                  `INSERT OR IGNORE INTO user_meta_data (Key, Value, Type, ref, label, idx) VALUES (?, ?, ?, 'ai', ?, ?)`,
                  [key, typeof value === 'object' ? JSON.stringify(value) : value, Array.isArray(value) ? 'array' : typeof value, label, valueObj.index]
                );
              });
            }
            // RESEARCH_PARAMS
            if (params.RESEARCH_PARAMS) {
              Object.entries(params.RESEARCH_PARAMS).forEach(([key, valueObj]) => {
                const label = makeLabel(key);
                const value = valueObj.value;
                db.run(
                  `INSERT OR IGNORE INTO user_meta_data (Key, Value, Type, ref, label, idx) VALUES (?, ?, ?, 'res', ?, ?)`,
                  [key, typeof value === 'object' ? JSON.stringify(value) : value, Array.isArray(value) ? 'array' : typeof value, label, valueObj.index]
                );
              });
            }
          });
          db.run(`
            CREATE TABLE IF NOT EXISTS ai_agents (
              slug TEXT PRIMARY KEY UNIQUE,
              is_active INTEGER,
              available_models TEXT,
              selected_model TEXT,
              key_name TEXT,
              key_value TEXT,
              icon TEXT
            );
          `, [], (err) => {
            if (err) {
              console.log('Failed to create ai_agents table:', err);
              return reject(err);
            }
            // Check if table is empty, then initialize from supported_agents.json
            db.get('SELECT COUNT(*) as count FROM ai_agents', [], (err, row: any) => {
              if (err) {
                console.log('Failed to count ai_agents:', err);
                return reject(err);
              }
              if (row.count === 0) {
                // Read supported_agents.json and insert
                const agentsPath = path.join(app.getAppPath(), 'backend', 'default_settings', 'supported_agents.json');
                fs.readFile(agentsPath, 'utf8', (err, data) => {
                  if (err) {
                    console.log('Failed to read supported_agents.json:', err);
                    return reject(err);
                  }
                  let agents;
                  try {
                    agents = JSON.parse(data);
                  } catch (e) {
                    console.log('Invalid JSON in supported_agents.json:', e);
                    return reject(e);
                  }
                  agents.forEach((agent: any) => {
                    db.run(
                      `INSERT INTO ai_agents (slug, is_active, available_models, selected_model, key_name, key_value, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [
                        agent.name.toLowerCase(),
                        agent.is_default ? 1 : 0,
                        JSON.stringify(agent.supported_models || []),
                        (agent.supported_models && agent.supported_models[0]) || '',
                        agent.key_name || '',
                        '', // key_value is empty by default
                        agent.icon || ''
                      ],
                      (err) => {
                        if (err) {
                          console.log('Failed to insert ai_agent:', err);
                          return reject(err);
                        }
                      }
                    );
                  });
                });
              }
            });
          });
          db.run(`
            CREATE TABLE IF NOT EXISTS search_retrievers (
              slug TEXT PRIMARY KEY UNIQUE,
              description TEXT,
              url TEXT,
              icon TEXT,
              type TEXT,
              key_name TEXT,
              key_value TEXT,
              is_active INTEGER,
              recommendation TEXT
            );
          `, [], (err) => {
            if (err) {
              console.log('Failed to create search_retrievers table:', err);
              return reject(err);
            }
            // Check if table is empty, then initialize from spported_retrievers.json
            db.get('SELECT COUNT(*) as count FROM search_retrievers', [], (err, row: any) => {
              if (err) {
                console.log('Failed to count search_retrievers:', err);
                return reject(err);
              }
              if (row.count === 0) {
                const retrieversPath = path.join(app.getAppPath(), 'backend', 'default_settings', 'supported_retrievers.json');
                fs.readFile(retrieversPath, 'utf8', (err, data) => {
                  if (err) {
                    console.log('Failed to read spported_retrievers.json:', err);
                    return reject(err);
                  }
                  let retrievers;
                  try {
                    retrievers = JSON.parse(data);
                  } catch (e) {
                    console.log('Invalid JSON in spported_retrievers.json:', e);
                    return reject(e);
                  }
                  retrievers.forEach((retriever: any) => {
                    db.run(
                      `INSERT INTO search_retrievers (slug, description, url, icon, type, key_name, key_value, is_active, recommendation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        retriever.name.toLowerCase(),
                        retriever.description || '',
                        retriever.url || '',
                        retriever.icon || '',
                        retriever.type || '',
                        retriever.key_name || '',
                        retriever.key_value || '',
                        1, // is_active default to true
                        retriever.recommendation || ''
                      ],
                      (err) => {
                        if (err) {
                          console.log('Failed to insert search_retriever:', err);
                          return reject(err);
                        }
                      }
                    );
                  });
                });
              }
            });
          });
          db.run(`
            CREATE TABLE IF NOT EXISTS research_resources (
              uid TEXT PRIMARY KEY UNIQUE,
              project_uid TEXT,
              title TEXT NOT NULL,
              url TEXT NOT NULL,
              summary TEXT,
              publishedDate TEXT,
              author TEXT,
              score REAL,
              sourceQuery TEXT,
              idx INTEGER,
              resource_type TEXT,
              UNIQUE(title, url)
            );
          `, [], (err) => {
            if (err) {
              console.log('Failed to create research_resources table:', err);
              return reject(err);
            }
            resolve([]);
          });
          db.run(`
            CREATE TABLE IF NOT EXISTS research_drafts (
              uid TEXT PRIMARY KEY UNIQUE,
              project_uid TEXT,
              title TEXT,
              outline TEXT,
              report TEXT,
              created_at TEXT,
              updated_at TEXT
            );
          `, [], (err) => {
            if (err) {
              console.log('Failed to create research_drafts table:', err);
              return reject(err);
            }
            resolve([]);
          });
        });
      });
    });
  });
}

// --- Research Projects CRUD ---
function listResearchProjects() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM research_projects ORDER BY created_at DESC', [], (err, rows: any[]) => {
      if (err) {
        console.log('DB list error:', err);
        return resolve([]);
      }
      resolve(rows.map(row => ({
        ...row,
        keywords: row.keywords ? JSON.parse(row.keywords) : [],
        research_questions: row.research_questions ? JSON.parse(row.research_questions) : [],
      })));
    });
  });
}

function createResearchProject(project: any) {
  return new Promise((resolve) => {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO research_projects (uid, title, keywords, description, research_questions, status, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.uid,
        project.title,
        JSON.stringify(project.keywords || []),
        project.description || '',
        JSON.stringify(project.research_questions || []),
        project.status || 'Not Started',
        now,
        now
      ],
      function (err) {
        if (err) {
          console.log('DB create error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function getResearchProject(uid: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM research_projects WHERE uid = ?', [uid], (err, row: any) => {
      if (err) {
        console.log('DB get error:', err);
        return resolve(null);
      }
      if (!row) return resolve(null);
      resolve({
        ...row,
        keywords: row.keywords ? JSON.parse(row.keywords) : [],
        research_questions: row.research_questions ? JSON.parse(row.research_questions) : [],
      });
    });
  });
}

function updateResearchProject(project: any) {
  return new Promise((resolve) => {
    const now = new Date().toISOString();
    db.run(
      `UPDATE research_projects SET title = ?, keywords = ?, description = ?, research_questions = ?, status = ?, updated_at = ? WHERE uid = ?`,
      [
        project.title,
        JSON.stringify(project.keywords || []),
        project.description || '',
        JSON.stringify(project.research_questions || []),
        project.status,
        now,
        project.uid
      ],
      function (err) {
        if (err) {
          console.log('DB update error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

// --- User Meta Data CRUD ---
function getAllUserMetaData() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM user_meta_data ORDER BY idx ASC', [], (err, rows: any[]) => {
      if (err) {
        console.log('user_meta_data:getAll error:', err);
        return resolve([]);
      }
      resolve(rows);
    });
  });
}

function getUserMetaData(key: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM user_meta_data WHERE Key = ? ORDER BY idx ASC', [key], (err, row: any) => {
      if (err) {
        console.log('user_meta_data:get error:', err);
        return resolve(null);
      }
      resolve(row);
    });
  });
}

function setUserMetaData(key: string, value: any, type: string) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO user_meta_data (Key, Value, Type) VALUES (?, ?, ?)
       ON CONFLICT(Key) DO UPDATE SET Value = excluded.Value, Type = excluded.Type`,
      [key, value, type],
      function (err) {
        if (err) {
          console.log('user_meta_data:set error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function listAIAgents() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM ai_agents', [], (err, rows: any[]) => {
      if (err) {
        console.log('ai_agents:list error:', err);
        return resolve([]);
      }
      resolve(rows.map(row => ({
        ...row,
        is_active: !!row.is_active,
        available_models: row.available_models ? JSON.parse(row.available_models) : [],
        icon: row.icon || ''
      })));
    });
  });
}

function updateAIAgent(agent: any) {
  return new Promise((resolve) => {
    // If setting this agent as active, set all others to inactive first
    if (agent.is_active) {
      db.run(
        `UPDATE ai_agents SET is_active = 0 WHERE slug != ?`,
        [agent.slug],
        (err) => {
          if (err) {
            console.log('ai_agents:deactivate others error:', err);
            // Continue to update the agent anyway
          }
          updateAgent();
        }
      );
    } else {
      updateAgent();
    }

    function updateAgent() {
      db.run(
        `UPDATE ai_agents SET 
          is_active = ?, 
          available_models = ?, 
          selected_model = ?, 
          key_name = ?, 
          key_value = ?, 
          icon = ?
        WHERE slug = ?`,
        [
          agent.is_active ? 1 : 0,
          JSON.stringify(agent.available_models || []),
          agent.selected_model || '',
          agent.key_name || '',
          agent.key_value || '',
          agent.icon || '',
          agent.slug
        ],
        function (err) {
          if (err) {
            console.log('ai_agents:update error:', err);
            return resolve({ success: false, error: err.message });
          }
          resolve({ success: true });
        }
      );
    }
  });
}

function getAIAgentBySlug(slug: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM ai_agents WHERE slug = ?', [slug], (err, row: any) => {
      if (err) {
        console.log('ai_agents:getBySlug error:', err);
        return resolve(null);
      }
      if (!row) return resolve(null);
      resolve({
        ...row,
        is_active: !!row.is_active,
        available_models: row.available_models ? JSON.parse(row.available_models) : [],
        icon: row.icon || ''
      });
    });
  });
}

function getUserMetaDataByRef(ref: string) {
  return new Promise((resolve) => {
    db.all('SELECT * FROM user_meta_data WHERE ref = ? ORDER BY idx ASC', [ref], (err, rows: any[]) => {
      if (err) {
        console.log('user_meta_data:getByRef error:', err);
        return resolve([]);
      }
      resolve(rows);
    });
  });
}

// Get user meta data by key
function getUserMetaDataByKey(key: string) {
  return new Promise((resolve) => {
      db.all('SELECT * FROM user_meta_data WHERE key = ?', [key], (err, rows) => {
          if (err) {
              console.log('user_meta_data:getByKey error:', err);
              return resolve([]);
          }
          if (rows.length > 0) {
            const rowData = rows[0] as { Value: any, Type: string };
            const dataType = rowData.Type;
            console.log('Value:', rowData.Value);
            console.log('Type:', dataType);
            switch (dataType) {
              case 'number':
                resolve(Number(rowData.Value));
                break;
              case 'boolean':
                resolve(rowData.Value === 'true');
                break;
              case 'array':
                resolve(JSON.parse(rowData.Value));
                break;
              case 'string':
              default:
                resolve(rowData.Value);
                break;
            }
          } else {
            resolve(null);
          }
      });
  });
}

// --- Search Retrievers CRUD ---
function listSearchRetrievers() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM search_retrievers', [], (err, rows: any[]) => {
      if (err) {
        console.log('search_retrievers:list error:', err);
        return resolve([]);
      }
      resolve(rows.map((row: any) => ({
        ...row,
        is_active: !!row.is_active,
      })));
    });
  });
}

function updateSearchRetriever(retriever: any) {
  return new Promise((resolve) => {
    db.run(
      `UPDATE search_retrievers SET 
        description = ?, 
        url = ?, 
        icon = ?, 
        type = ?, 
        key_name = ?, 
        key_value = ?, 
        is_active = ?,
        recommendation = ?
      WHERE slug = ?`,
      [
        retriever.description || '',
        retriever.url || '',
        retriever.icon || '',
        retriever.type || '',
        retriever.key_name || '',
        retriever.key_value || '',
        retriever.is_active ? 1 : 0,
        retriever.recommendation || '',
        retriever.slug
      ],
      function (err) {
        if (err) {
          console.log('search_retrievers:update error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function getRetrieverBySlug(slug: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM search_retrievers WHERE slug = ?', [slug], (err, row: any) => {
      if (err) {
        console.log('search_retrievers:getBySlug error:', err);
        return resolve(null);
      }
      if (!row) return resolve(null);
      resolve({
        ...row,
        is_active: !!row.is_active,
      });
    });
  });
}

// --- Resource (Literature/Files) CRUD ---
function saveLiteratureResults(projectId: string, results: Resource[]) {
  return new Promise((resolve) => {
    if (!Array.isArray(results)) return resolve({ success: false, error: 'Results must be an array' });
    const now = new Date().toISOString();
    let completed = 0;
    let hasError = false;
    results.forEach((resource) => {
      db.run(
        `INSERT OR IGNORE INTO research_resources (uid, project_uid, title, url, summary, publishedDate, author, score, sourceQuery, idx, resource_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resource.uid,
          projectId,
          resource.title,
          resource.url,
          resource.summary || null,
          resource.publishedDate ? (typeof resource.publishedDate === 'string' ? resource.publishedDate : new Date(resource.publishedDate).toISOString()) : now,
          resource.author || null,
          resource.score || null,
          resource.sourceQuery || null,
          resource.index || null,
          resource.resource_type || null
        ],
        (err) => {
          completed++;
          if (err) {
            hasError = true;
            console.log('Failed to save research resource:', err);
          }
          if (completed === results.length) {
            resolve({ success: !hasError });
          }
        }
      );
    });
    if (results.length === 0) resolve({ success: true });
  });
}

function getResourcesForProject(projectId: string) {
  return new Promise((resolve) => {
    db.all(
      `SELECT * FROM research_resources WHERE project_uid = ? ORDER BY idx ASC`,
      [projectId],
      (err, rows: any[]) => {
        if (err) {
          console.log('Failed to get resources for project:', err);
          return resolve([]);
        }
        const resources = rows.map(row => ({
          ...row,
          publishedDate: row.publishedDate ? new Date(row.publishedDate).toISOString() : null,
        }));
        resolve(resources);
      }
    );
  });
}

function addResourceToProject(projectId: string, resource: Resource) {
  if (!resource.uid) resource.uid = generateUID();
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO research_resources (uid, project_uid, title, url, summary, publishedDate, author, score, sourceQuery, idx, resource_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resource.uid,
        projectId,
        resource.title,
        resource.url,
        resource.summary || null,
        resource.publishedDate ? (typeof resource.publishedDate === 'string' ? resource.publishedDate : new Date(resource.publishedDate).toISOString()) : null,
        resource.author || null,
        resource.score || null,
        resource.sourceQuery || null,
        resource.index || null,
        resource.resource_type || null
      ],
      function (err: Error) {
        if (err) {
          console.log('Failed to add resource to project:', err);
          if ((err as any).code === 'SQLITE_CONSTRAINT') {
            return resolve({ success: false, error: 'A resource with this title and URL/path already exists.' });
          }
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true, uid: resource.uid });
      }
    );
  });
}

function updateResource(resource: Resource) {
  return new Promise((resolve) => {
    db.run(
      `UPDATE research_resources SET title = ?, url = ?, summary = ?, publishedDate = ?, author = ?, score = ?, sourceQuery = ?, idx = ?, resource_type = ? WHERE uid = ?`,
      [
        resource.title,
        resource.url,
        resource.summary || null,
        resource.publishedDate ? (typeof resource.publishedDate === 'string' ? resource.publishedDate : new Date(resource.publishedDate).toISOString()) : null,
        resource.author || null,
        resource.score || null,
        resource.sourceQuery || null,
        resource.index || null,
        resource.resource_type || null,
        resource.uid
      ],
      function (err: Error) {
        if (err) {
          console.log('Failed to update resource:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function deleteResource(resourceId: string) {
  return new Promise((resolve) => {
    db.run(
      `DELETE FROM research_resources WHERE uid = ?`,
      [resourceId],
      function (err: Error) {
        if (err) {
          console.log('Failed to delete resource:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

// --- Research Drafts CRUD ---
function getAllResearchDrafts(projectId: string) {
  return new Promise((resolve) => {
    db.all('SELECT * FROM research_drafts WHERE project_uid = ? ORDER BY created_at DESC', [projectId], (err, rows: any[]) => {
      if (err) {
        console.log('DB getAllResearchDrafts error:', err);
        return resolve([]);
      }
      resolve(rows.map((row: any) => ({
        ...row,
        outline: row.outline ? JSON.parse(row.outline) : undefined,
      })));
    });
  });
}

function getResearchDraft(draftId: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM research_drafts WHERE uid = ?', [draftId], (err, row: any) => {
      if (err) {
        console.log('DB getResearchDraft error:', err);
        return resolve(null); 
      }
      if (!row) return resolve(null);
      resolve({
        ...row,
        outline: row.outline ? JSON.parse(row.outline) : undefined,
      });
    });
  });
}

function addResearchDraftToProject(draft: ResearchDraft) {
  draft.created_at = new Date().toISOString();
  return new Promise((resolve) => {
    if (!draft.uid) return resolve({ success: false, error: 'Draft UID is required' });
    db.run(
      `INSERT INTO research_drafts (uid, project_uid, title, outline, report, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [draft.uid, draft.project_uid, draft.title, JSON.stringify(draft.outline), draft.report, draft.created_at],
      function (err) {
        if (err) {
          console.log('DB addResearchDraftToProject error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function updateResearchDraft(draft: ResearchDraft) {
  draft.updated_at = new Date().toISOString();
  return new Promise((resolve) => {
    db.run(
      `UPDATE research_drafts SET title = ?, outline = ?, report = ?, updated_at = ? WHERE uid = ?`,
      [draft.title, JSON.stringify(draft.outline), draft.report, draft.updated_at, draft.uid],
      function (err) {
        if (err) {
          console.log('DB updateResearchDraft error:', err);
          return resolve({ success: false, error: err.message });
        }
        resolve({ success: true });
      }
    );
  });
}

function updateResearchDraftReport(draft: { uid: string, report: string }) {
  return new Promise((resolve) => {
    try {
      // Input validation
      if (!draft.uid) {
        return resolve({ success: false, error: 'Draft UID is required' });
      }

      if (typeof draft.report !== 'string') {
        return resolve({ success: false, error: 'Report must be a string' });
      }

      const updated_at = new Date().toISOString();
      
      // Log only the size, not the content, to avoid flooding logs
      console.log('DB updateResearchDraftReport:', {
        uid: draft.uid,
        reportPreview: draft.report.slice(0, 100),
        reportLength: draft.report.length,
        updated_at
      });

      // First check if the draft exists
      db.get('SELECT uid FROM research_drafts WHERE uid = ?', [draft.uid], (err, row) => {
        if (err) {
          console.error('DB updateResearchDraftReport check error:', err);
          return resolve({ success: false, error: 'Database error while checking draft existence' });
        }

        if (!row) {
          return resolve({ success: false, error: 'Draft not found' });
        }

        // Proceed with update if draft exists
        db.run(
          `UPDATE research_drafts SET report = ?, updated_at = ? WHERE uid = ?`,
          [draft.report, updated_at, draft.uid],
          function (err) {
            if (err) {
              console.error('DB updateResearchDraftReport error:', err);
              return resolve({ 
                success: false, 
                error: `Database error: ${err.message}`
              });
            }

            if (this.changes === 0) {
              return resolve({ 
                success: false, 
                error: 'No changes were made to the draft'
              });
            }

            resolve({ 
              success: true,
              message: 'Draft report updated successfully'
            });
          }
        );
      });
    } catch (error) {
      console.error('DB updateResearchDraftReport unexpected error:', error);
      resolve({ 
        success: false, 
        error: 'An unexpected error occurred while updating the draft report'
      });
    }
  });
}

function deleteResearchDraft(draftId: string) {
  return new Promise((resolve) => {
    db.run(`DELETE FROM research_drafts WHERE uid = ?`, [draftId], function (err) {
      if (err) {
        console.log('DB deleteResearchDraft error:', err);
        return resolve({ success: false, error: err.message });
      }
      resolve({ success: true });
    });
  });
}

export {
  initializeTables,
  listResearchProjects,
  createResearchProject,
  getResearchProject,
  updateResearchProject,
  getAllUserMetaData,
  getUserMetaData,
  setUserMetaData,
  listAIAgents,
  updateAIAgent,
  getAIAgentBySlug,
  getUserMetaDataByRef,
  getUserMetaDataByKey,
  listSearchRetrievers,
  updateSearchRetriever,
  getRetrieverBySlug,
  saveLiteratureResults,
  getResourcesForProject,
  addResourceToProject,
  updateResource,
  deleteResource,
  getAllResearchDrafts,
  getResearchDraft,
  addResearchDraftToProject,
  updateResearchDraft,
  updateResearchDraftReport,
  deleteResearchDraft
};

 