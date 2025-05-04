import { fileURLToPath } from 'url';
import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS user_meta_data (
        Key TEXT PRIMARY KEY UNIQUE,
        Value TEXT,
        Type TEXT
      );
    `);
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
        return;
      }
      // Check if table is empty, then initialize from supported_agents.json
      db.get('SELECT COUNT(*) as count FROM ai_agents', [], (err, row) => {
        if (err) {
          console.error('Failed to count ai_agents:', err);
          return;
        }
        if (row.count === 0) {
          // Read supported_agents.json and insert
          const agentsPath = path.join(__dirname, 'ai_client', 'agents', 'supported_agents.json');
          fs.readFile(agentsPath, 'utf8', (err, data) => {
            if (err) {
              console.error('Failed to read supported_agents.json:', err);
              return;
            }
            let agents;
            try {
              agents = JSON.parse(data);
            } catch (e) {
              console.error('Invalid JSON in supported_agents.json:', e);
              return;
            }
            agents.forEach(agent => {
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
                  }
                }
              );
            });
          });
        }
      });
    });
  });
}

// --- Research Projects CRUD ---
function listResearchProjects() {
  return new Promise((resolve) => {
    db.all('SELECT * FROM research_projects ORDER BY created_at DESC', [], (err, rows) => {
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

function createResearchProject(project) {
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

function getResearchProject(uid) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM research_projects WHERE uid = ?', [uid], (err, row) => {
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

function updateResearchProject(project) {
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
    db.all('SELECT * FROM user_meta_data', [], (err, rows) => {
      if (err) {
        console.error('user_meta_data:getAll error:', err);
        return resolve([]);
      }
      resolve(rows);
    });
  });
}

function getUserMetaData(key) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM user_meta_data WHERE Key = ?', [key], (err, row) => {
      if (err) {
        console.error('user_meta_data:get error:', err);
        return resolve(null);
      }
      resolve(row);
    });
  });
}

function setUserMetaData(key, value, type) {
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
    db.all('SELECT * FROM ai_agents', [], (err, rows) => {
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
};

 