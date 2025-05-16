import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { app } from 'electron';

// Path for the SQLite database file
const dbPath = path.join(app.getPath('userData'), 'research_management.sqlite');

// Ensure the directory exists
fs.mkdirSync(app.getPath('userData'), { recursive: true });

// Open or create the database (serialized mode)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
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
            label TEXT
          );
        `, [], (err) => {
          if (err) return reject(err);
          // Add label column if it doesn't exist
          // db.get("PRAGMA table_info(user_meta_data);", [], (err, rows) => {
          //   if (err) return;
          //   if (!rows.some(r => r.name === 'label')) {
          //     db.run('ALTER TABLE user_meta_data ADD COLUMN label TEXT', [], (err) => {
          //       if (err) console.error('Failed to add label column:', err);
          //     });
          //   }
          // });
          // Set ref='gen' for existing fields with null ref
          db.run(`UPDATE user_meta_data SET ref='gen' WHERE ref IS NULL OR ref=''`);

          // Helper to generate label from key
          function makeLabel(key: string) {
            if (!key) return '';
            const s = key.replace(/_/g, ' ').toLowerCase();
            return s.charAt(0).toUpperCase() + s.slice(1);
          }

          // Load default_params.json and insert AI_AGENT_PARAMS and RESEARCH_PARAMS
          const paramsPath = path.join(__dirname, 'ai_client', 'agents', 'default_params.json');
          fs.readFile(paramsPath, 'utf8', (err, data) => {
            if (err) return;
            let params;
            try {
              params = JSON.parse(data);
            } catch (e) { return; }
            // AI_AGENT_PARAMS
            if (params.AI_AGENT_PARAMS) {
              Object.entries(params.AI_AGENT_PARAMS).forEach(([key, value]) => {
                const label = makeLabel(key);
                db.run(
                  `INSERT OR IGNORE INTO user_meta_data (Key, Value, Type, ref, label) VALUES (?, ?, ?, 'ai', ?)`,
                  [key, typeof value === 'object' ? JSON.stringify(value) : value, Array.isArray(value) ? 'array' : typeof value, label]
                );
              });
            }
            // RESEARCH_PARAMS
            if (params.RESEARCH_PARAMS) {
              Object.entries(params.RESEARCH_PARAMS).forEach(([key, value]) => {
                const label = makeLabel(key);
                db.run(
                  `INSERT OR IGNORE INTO user_meta_data (Key, Value, Type, ref, label) VALUES (?, ?, ?, 'res', ?)`,
                  [key, typeof value === 'object' ? JSON.stringify(value) : value, Array.isArray(value) ? 'array' : typeof value, label]
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
              console.error('Failed to create ai_agents table:', err);
              return reject(err);
            }
            // Check if table is empty, then initialize from supported_agents.json
            db.get('SELECT COUNT(*) as count FROM ai_agents', [], (err, row: any) => {
              if (err) {
                console.error('Failed to count ai_agents:', err);
                return reject(err);
              }
              if (row.count === 0) {
                // Read supported_agents.json and insert
                // const agentsPath = path.join(__dirname, 'ai_client', 'agents', 'supported_agents.json');
                const agentsPath = path.join(app.getAppPath(), 'backend', 'ai_client', 'agents', 'supported_agents.json');
                fs.readFile(agentsPath, 'utf8', (err, data) => {
                  if (err) {
                    console.error('Failed to read supported_agents.json:', err);
                    return reject(err);
                  }
                  let agents;
                  try {
                    agents = JSON.parse(data);
                  } catch (e) {
                    console.error('Invalid JSON in supported_agents.json:', e);
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
                          console.error('Failed to insert ai_agent:', err);
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
              is_active INTEGER
            );
          `, [], (err) => {
            if (err) {
              console.error('Failed to create search_retrievers table:', err);
              return reject(err);
            }
            // Check if table is empty, then initialize from spported_retrievers.json
            db.get('SELECT COUNT(*) as count FROM search_retrievers', [], (err, row: any) => {
              if (err) {
                console.error('Failed to count search_retrievers:', err);
                return reject(err);
              }
              if (row.count === 0) {
                const retrieversPath = path.join(app.getAppPath(), 'backend', 'search_client', 'retrievers', 'spported_retrievers.json');
                fs.readFile(retrieversPath, 'utf8', (err, data) => {
                  if (err) {
                    console.error('Failed to read spported_retrievers.json:', err);
                    return reject(err);
                  }
                  let retrievers;
                  try {
                    retrievers = JSON.parse(data);
                  } catch (e) {
                    console.error('Invalid JSON in spported_retrievers.json:', e);
                    return reject(e);
                  }
                  retrievers.forEach((retriever: any) => {
                    db.run(
                      `INSERT INTO search_retrievers (slug, description, url, icon, type, key_name, key_value, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        retriever.name.toLowerCase(),
                        retriever.description || '',
                        retriever.url || '',
                        retriever.icon || '',
                        retriever.type || '',
                        retriever.key_name || '',
                        retriever.key_value || '',
                        1 // is_active default to true
                      ],
                      (err) => {
                        if (err) {
                          console.error('Failed to insert search_retriever:', err);
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
            CREATE TABLE IF NOT EXISTS research_papers (
              uid TEXT PRIMARY KEY UNIQUE,
              project_uid TEXT,
              title TEXT,
              url TEXT,
              publishedDate TEXT,
              author TEXT,
              score REAL,
              summary TEXT,
              sourceQuery TEXT,
              idx INTEGER,
              UNIQUE(title, url)
            );
          `, [], (err) => {
            if (err) {
              console.error('Failed to create research_papers table:', err);
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
        console.error('DB list error:', err);
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
      `INSERT INTO research_projects (uid, title, keywords, description, research_questions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        project.uid,
        project.title,
        JSON.stringify(project.keywords || []),
        project.description || '',
        JSON.stringify(project.research_questions || []),
        now,
        now
      ],
      function (err) {
        if (err) {
          console.error('DB create error:', err);
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
        console.error('DB get error:', err);
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
      `UPDATE research_projects SET title = ?, keywords = ?, description = ?, research_questions = ?, updated_at = ? WHERE uid = ?`,
      [
        project.title,
        JSON.stringify(project.keywords || []),
        project.description || '',
        JSON.stringify(project.research_questions || []),
        now,
        project.uid
      ],
      function (err) {
        if (err) {
          console.error('DB update error:', err);
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
    db.all('SELECT * FROM user_meta_data', [], (err, rows: any[]) => {
      if (err) {
        console.error('user_meta_data:getAll error:', err);
        return resolve([]);
      }
      resolve(rows);
    });
  });
}

function getUserMetaData(key: string) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM user_meta_data WHERE Key = ?', [key], (err, row: any) => {
      if (err) {
        console.error('user_meta_data:get error:', err);
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
          console.error('user_meta_data:set error:', err);
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
        console.error('ai_agents:list error:', err);
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
            console.error('ai_agents:deactivate others error:', err);
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
            console.error('ai_agents:update error:', err);
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
        console.error('ai_agents:getBySlug error:', err);
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
    db.all('SELECT * FROM user_meta_data WHERE ref = ?', [ref], (err, rows: any[]) => {
      if (err) {
        console.error('user_meta_data:getByRef error:', err);
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
              console.error('user_meta_data:getByKey error:', err);
              return resolve([]);
          }
          resolve(rows);
      });
  });
}

// --- Search Retrievers CRUD ---
function listSearchRetrievers() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM search_retrievers', [], (err, rows: any[]) => {
      if (err) {
        console.error('search_retrievers:list error:', err);
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
        is_active = ?
      WHERE slug = ?`,
      [
        retriever.description || '',
        retriever.url || '',
        retriever.icon || '',
        retriever.type || '',
        retriever.key_name || '',
        retriever.key_value || '',
        retriever.is_active ? 1 : 0,
        retriever.slug
      ],
      function (err) {
        if (err) {
          console.error('search_retrievers:update error:', err);
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
        console.error('search_retrievers:getBySlug error:', err);
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

// --- Literature CRUD ---
function saveLiteratureResults(projectId: string, results: any[]) {
  return new Promise((resolve) => {
    if (!Array.isArray(results)) return resolve({ success: false, error: 'Results must be an array' });
    const now = new Date().toISOString();
    let completed = 0;
    let hasError = false;
    results.forEach((paper) => {
      db.run(
        `INSERT OR IGNORE INTO research_papers (uid, project_uid, title, url, publishedDate, author, score, summary, sourceQuery, idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paper.uid,
          projectId,
          paper.title,
          paper.url,
          paper.publishedDate ? (typeof paper.publishedDate === 'string' ? paper.publishedDate : new Date(paper.publishedDate).toISOString()) : now,
          paper.author,
          paper.score,
          paper.summary,
          paper.sourceQuery,
          paper.index
        ],
        (err) => {
          completed++;
          if (err) {
            hasError = true;
            console.error('Failed to save research paper:', err);
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

function getLiteratureResults(projectId: string) {
  return new Promise((resolve) => {
    db.all(
      `SELECT * FROM research_papers WHERE project_uid = ? ORDER BY idx ASC`,
      [projectId],
      (err, rows: any[]) => {
        if (err) {
          console.error('Failed to get research papers:', err);
          return resolve([]);
        }
        // Parse publishedDate as ISO string
        const papers = rows.map(row => ({
          ...row,
          publishedDate: row.publishedDate ? new Date(row.publishedDate) : null,
        }));
        resolve(papers);
      }
    );
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
  getLiteratureResults,
};

 