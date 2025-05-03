// const path = require('path');
// const sqlite3 = require('sqlite3').verbose();
// const fs = require('fs');
// const { app } = require('electron');
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

export {
  initializeTables,
  listResearchProjects,
  createResearchProject,
  getResearchProject,
  updateResearchProject,
  getAllUserMetaData,
  getUserMetaData,
  setUserMetaData,
};

 