/**
 * Bundled synthetic sample project: "todo-app"
 * A fictional JavaScript todo application used as the simulator's virtual filesystem.
 * Tool calls like read_file / list_files / search_files operate on these files.
 */
export const SAMPLE_FILES = {

'README.md': `# todo-app

A lightweight todo application built with vanilla JavaScript.

## Features
- Create, edit, and delete todos
- Mark todos as complete
- Filter by status (all / active / completed)
- Persist todos to localStorage
- Sync with remote API (optional)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Project Structure

\`\`\`
src/
  index.js          Entry point
  api.js            Remote API client
  storage.js        localStorage wrapper
  components/
    App.js          Root component
    TodoList.js     Renders the todo list
    TodoItem.js     Individual todo row
tests/
  storage.test.js   Unit tests for storage module
\`\`\`

## Configuration

Set \`VITE_API_BASE\` in \`.env\` to point to a remote todo API.
Omit it to run in offline mode (localStorage only).

## License
MIT`,

'package.json': `{
  "name": "todo-app",
  "version": "1.2.0",
  "description": "Lightweight todo app with localStorage and optional API sync",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}`,

'src/index.js': `import { loadTodos, saveTodos } from './storage.js';
import { App } from './components/App.js';

const root = document.getElementById('root');
const todos = loadTodos();

const app = new App({ todos, onSave: saveTodos });
app.mount(root);`,

'src/api.js': `const BASE_URL = import.meta.env.VITE_API_BASE ?? null;

export async function fetchTodos() {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos\`);
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}

export async function createTodo(text) {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, done: false }),
  });
  return res.json();
}

export async function updateTodo(id, patch) {
  if (!BASE_URL) return null;
  const res = await fetch(\`\${BASE_URL}/todos/\${id}\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteTodo(id) {
  if (!BASE_URL) return null;
  await fetch(\`\${BASE_URL}/todos/\${id}\`, { method: 'DELETE' });
}`,

'src/storage.js': `const KEY = 'todos-v1';

export function loadTodos() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos) {
  localStorage.setItem(KEY, JSON.stringify(todos));
}

export function clearTodos() {
  localStorage.removeItem(KEY);
}`,

'src/components/App.js': `import { TodoList } from './TodoList.js';

export class App {
  constructor({ todos, onSave }) {
    this.todos = todos;
    this.onSave = onSave;
    this.filter = 'all';
  }

  addTodo(text) {
    if (!text.trim()) return;
    this.todos.push({ id: Date.now(), text: text.trim(), done: false });
    this.onSave(this.todos);
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) { todo.done = !todo.done; this.onSave(this.todos); this.render(); }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.onSave(this.todos);
    this.render();
  }

  setFilter(f) { this.filter = f; this.render(); }

  get visible() {
    if (this.filter === 'active')    return this.todos.filter(t => !t.done);
    if (this.filter === 'completed') return this.todos.filter(t =>  t.done);
    return this.todos;
  }

  mount(root) { this.root = root; this.render(); }

  render() {
    if (!this.root) return;
    this.root.innerHTML = \`
      <div class="app">
        <h1>Todos</h1>
        <input id="new-todo" placeholder="What needs to be done?" />
        <div id="list"></div>
        <div class="filters">
          <button class="\${this.filter==='all'?'active':''}" data-f="all">All</button>
          <button class="\${this.filter==='active'?'active':''}" data-f="active">Active</button>
          <button class="\${this.filter==='completed'?'active':''}" data-f="completed">Completed</button>
        </div>
      </div>\`;
    new TodoList({ todos: this.visible, onToggle: id=>this.toggleTodo(id), onDelete: id=>this.deleteTodo(id) })
      .mount(this.root.querySelector('#list'));
    this.root.querySelector('#new-todo').addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.addTodo(e.target.value); e.target.value = ''; }
    });
    this.root.querySelectorAll('[data-f]').forEach(btn =>
      btn.addEventListener('click', () => this.setFilter(btn.dataset.f)));
  }
}`,

'src/components/TodoList.js': `import { TodoItem } from './TodoItem.js';

export class TodoList {
  constructor({ todos, onToggle, onDelete }) {
    this.todos = todos;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
  }

  mount(el) {
    el.innerHTML = '';
    if (this.todos.length === 0) {
      el.innerHTML = '<p class="empty">No todos yet.</p>';
      return;
    }
    this.todos.forEach(todo => {
      new TodoItem({ todo, onToggle: this.onToggle, onDelete: this.onDelete }).mount(el);
    });
  }
}`,

'src/components/TodoItem.js': `export class TodoItem {
  constructor({ todo, onToggle, onDelete }) {
    this.todo = todo;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
  }

  mount(el) {
    const div = document.createElement('div');
    div.className = \`todo-item\${this.todo.done ? ' done' : ''}\`;
    div.innerHTML = \`
      <input type="checkbox" \${this.todo.done ? 'checked' : ''} />
      <span>\${this.todo.text}</span>
      <button class="delete">×</button>\`;
    div.querySelector('input').addEventListener('change', () => this.onToggle(this.todo.id));
    div.querySelector('.delete').addEventListener('click', () => this.onDelete(this.todo.id));
    el.appendChild(div);
  }
}`,

'tests/storage.test.js': `import { describe, it, expect, beforeEach } from 'vitest';
import { loadTodos, saveTodos, clearTodos } from '../src/storage.js';

describe('storage', () => {
  beforeEach(() => clearTodos());

  it('returns empty array when no data', () => {
    expect(loadTodos()).toEqual([]);
  });

  it('saves and loads todos', () => {
    const todos = [{ id: 1, text: 'Buy milk', done: false }];
    saveTodos(todos);
    expect(loadTodos()).toEqual(todos);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('todos-v1', '{bad json}');
    expect(loadTodos()).toEqual([]);
  });

  it('clears todos', () => {
    saveTodos([{ id: 1, text: 'Test', done: false }]);
    clearTodos();
    expect(loadTodos()).toEqual([]);
  });
});`,

};

export const FILE_TREE = Object.keys(SAMPLE_FILES);
