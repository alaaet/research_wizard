<p align="center">
  <img src="assets/icons/png/rwiz.png" alt="Research Wizard Logo" width="80"/>
</p>

<h1 align="center">Research Wizard</h1>

<p align="center">
  <b>Your all-in-one desktop workspace for research management, literature discovery, and AI-powered drafting.</b>
</p>

---
[![Build and Release Electron App](https://github.com/alaaet/research_wizard/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alaaet/research_wizard/actions/workflows/release.yml)
## 🚀 Overview

**Research Wizard** is a modern desktop application that streamlines the entire research workflow. Manage projects, discover literature, and draft reports with the help of advanced AI agents—all in a unified, customizable workspace.

---

## ✨ Features

- **Project Management:** Create, organize, and edit research projects with metadata, keywords, and research questions. AI-assisted keyword/question generation.
- **Literature Discovery & Management:**
  - Search and import papers from top research databases (see Integrations below).
  - Annotate, organize, and manage literature per project.
- **AI-Powered Drafting:**
  - Generate outlines and full drafts using leading AI models (Gemini, OpenAI, Claude).
  - Both manual and AI-assisted drafting supported.
- **Customizable Report Generation:**
  - Generate, edit, and export research reports in Markdown, DOCX, or PDF.
  - Fine-tune report parameters and structure.
- **Settings & Integrations:**
  - Configure AI agents and literature retrievers, manage API keys, and set user/language preferences.
  - Modular and extensible for new integrations.
- **Internationalization:**
  - UI supports multiple languages and RTL/LTR layouts.
- **Modern UI/UX:**
  - Built with reusable, accessible components and a clean, responsive design.

---

## 🔌 Integrations

### **AI Agents**
- **Gemini (Google AI)** — default
- **OpenAI**
- **Claude (Anthropic)**

### **Literature Retrievers**
- Exa (AI-based, free-tier available)
- Crossref
- DBLP
- PLOS
- OpenAlex
- EuropePMC
- CoreAPI
- Elsevier
- NCBI-NIH
- arXiv
- Semantic Scholar

> Each retriever/agent can be enabled, configured, or extended via the Settings panel.

---

## 🏗️ Architecture

- **Frontend:** React + TypeScript, modular component system, hooks, and context for state management.
- **Backend:** Node.js/TypeScript, modular clients for AI and literature APIs, extensible retriever/agent system.
- **IPC Connectors:** Seamless communication between frontend and backend for data, AI, and search operations.
- **Internationalization:** Built-in i18n with support for multiple languages and RTL/LTR layouts.

---

## 🖥️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alaaet/research_wizard.git
   cd research_wizard
   ```
2. **Install dependencies:**
   ```bash
   # For example, if using npm
   npm install
   ```
3. **Run the app:**
   ```bash
   npm start
   ```
   _Or follow the [detailed installation guide](https://alaaet.github.io/research_wizard/) for your OS._

---

## 🛠️ Customization & Extensibility

- **Add New AI Agents or Retrievers:**
  - Extend the backend by adding new modules in `backend/ai_client/agents` or `backend/search_client/retrievers`.
  - Register new agents/retrievers in the settings JSON files.
- **UI Customization:**
  - Modify or add React components in `src/components`.
- **Internationalization:**
  - Add new languages in `src/locales`.

---

## 👩‍💻 Developer Guide

- **Code Structure:**
  - `src/` — Frontend (React, UI, hooks, pages)
  - `backend/` — Backend (API clients, search, AI, utilities)
- **API Keys:**
  - Store your API keys for AI agents and retrievers in the Settings panel or as environment variables.
- **Contribution Guide:**
  - See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

---

## 📚 Documentation

- [Official Documentation & Guides](https://alaaet.github.io/research_wizard/)

---

## 🤝 Contributing

We welcome contributions! Please read our [contribution guidelines](CONTRIBUTING.md) and open an issue or pull request.

---

## 📢 Credits

- Icons from [LobeHub](https://lobehub.com)
- Built with ❤️ for the research community
- Code was partially created by [Lovable](https://lovable.dev/)
- [Cursor](https://www.cursor.com/) contributed to some specific implementations