# Project Specification: Research Management Tool

## 1. Overview

This project involves adapting an existing Electron.js boilerplate application (originally a CRM) into a dedicated Research Management Tool. The tool will allow users to define, store, and manage research projects locally using an integrated SQLite database. All data transactions will leverage TypeScript for type safety.

## 2. Goals

* Develop a core module for managing research projects within the Electron application.
* Implement a local data storage solution using SQLite, integrated within the app.
* Utilize TypeScript for defining data structures and handling data operations.
* Provide a user interface for creating and viewing research projects.
* Establish a foundation for future expansion with more research-related features.

## 3. Technology Stack

* **Framework:** Electron.js
* **Language:** TypeScript
* **Database:** SQLite (local, integrated)
* **Frontend:** (Assumed from Electron boilerplate - e.g., HTML, CSS, potentially a JS framework like React/Vue/Angular if present)

## 4. Core Features (Initial Phase)

### 4.1. Research Project Management

* **Create New Research Project:**
    * Users must be able to initiate the creation of a new research project.
    * A dedicated form/view will capture the project details.
    * The `title` field is mandatory.
    * `keywords`, `description`, and `research_questions` are optional.
    * Upon submission, a unique `uid` (16-character hash) will be automatically generated.
    * The new project record will be saved to the local SQLite database.
* **View Research Projects:**
    * A dedicated view/screen will display a list of all existing research projects.
    * The list should display key information, minimally the `title` of each project.
    * (Future enhancement: Clicking a project could lead to a detail view or an edit view).

## 5. Data Model

The primary data entity for this phase is `ResearchProject`.

* **Database:** SQLite
* **Table Name:** `research_projects` ( öneri)

| Column Name          | Data Type (SQLite) | Data Type (TypeScript) | Constraints          | Description                                                                 |
| :------------------- | :----------------- | :--------------------- | :------------------- | :-------------------------------------------------------------------------- |
| `uid`                | TEXT               | `string`               | PRIMARY KEY, UNIQUE  | Auto-generated 16-character unique hash identifier.                         |
| `title`              | TEXT               | `string`               | NOT NULL             | The mandatory title of the research project.                                |
| `keywords`           | TEXT               | `string[]`             | NULLABLE             | Optional list of keywords. Stored as a JSON string in SQLite.             |
| `description`        | TEXT               | `string`               | NULLABLE             | Optional detailed description of the research project.                      |
| `research_questions` | TEXT               | `string[]`             | NULLABLE             | Optional list of research questions. Stored as a JSON string in SQLite. |
| `created_at`         | TEXT               | `string` / `Date`      | NOT NULL, DEFAULTNOW | Timestamp when the record was created (ISO 8601 format recommended). |
| `updated_at`         | TEXT               | `string` / `Date`      | NOT NULL, DEFAULTNOW | Timestamp when the record was last updated (ISO 8601 format recommended). |

**Note on Array Storage:** Since SQLite doesn't have a native array type, array fields (`keywords`, `research_questions`) will be stored as JSON strings (e.g., `JSON.stringify(array)` before saving, `JSON.parse(string)` after retrieving). TypeScript interfaces should still define them as `string[]`.

## 6. User Interface (UI) / User Experience (UX)

* **Main Navigation:** The application should provide clear navigation to the "Research Projects" section.
* **Project List View:**
    * Displays existing projects (likely in a table or list format).
    * Must include a button/action to "Create New Research Project".
* **Project Creation/Edit Form:**
    * A form containing input fields for `title`, `keywords`, `description`, and `research_questions`.
    * Input for `keywords` and `research_questions` should ideally allow adding/removing multiple string entries (e.g., using tags input component).
    * Clear indication that `title` is required.
    * Save/Submit and Cancel buttons.

## 7. Technical Considerations

* **UID Generation:** Implement a reliable function to generate cryptographically strong 16-character unique identifiers (e.g., using Node.js `crypto` module or a library like `nanoid`). Ensure generated IDs are unique within the `research_projects` table.
* **TypeScript Implementation:**
    * Define a clear TypeScript `interface` or `type` for `ResearchProject`.
    * Use TypeScript for all database interaction functions (CRUD operations) to ensure type safety.
    * Handle the serialization (`JSON.stringify`) and deserialization (`JSON.parse`) of array fields when interacting with the database.
* **SQLite Integration:**
    * Configure the chosen SQLite library (e.g., `sqlite3`, `better-sqlite3`) to work correctly within the Electron environment (main vs. renderer process considerations).
    * Implement database migrations or schema setup logic to create the `research_projects` table if it doesn't exist.
    * Ensure database connections are managed appropriately (opened/closed correctly).
* **Data Validation:** Implement validation logic (both frontend and backend/main process if applicable) to enforce constraints (e.g., required `title`).

## 8. Future Enhancements (Potential)

* Editing and Deleting existing research projects.
* Adding status tracking to projects (e.g., 'Not Started', 'In Progress', 'Completed').
* Linking resources (files, URLs, notes) to projects.
* Advanced searching and filtering of projects.
* Data import/export functionality.
* Adding collaborators or user management (if shifting away from purely local).