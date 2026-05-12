const STORAGE_KEY = "todo-list-web:v1";

/** @typedef {{ id: string; title: string; done: boolean }} Todo */

/** @type {Todo[]} */
let todos = [];
let filter = "all";

const form = document.getElementById("form-add");
const input = document.getElementById("input-title");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count-active");
const btnClear = document.getElementById("btn-clear");
const chips = document.querySelectorAll(".chip");

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      todos = parsed.filter(
        (t) => t && typeof t.id === "string" && typeof t.title === "string" && typeof t.done === "boolean"
      );
    }
  } catch {
    todos = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function visibleTodos() {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "completed") return todos.filter((t) => t.done);
  return todos;
}

function activeCount() {
  return todos.filter((t) => !t.done).length;
}

function completedCount() {
  return todos.filter((t) => t.done).length;
}

function render() {
  const items = visibleTodos();
  listEl.innerHTML = "";

  emptyEl.hidden = todos.length > 0 && items.length > 0;
  if (todos.length === 0) emptyEl.hidden = false;

  const n = activeCount();
  countEl.textContent = n === 0 ? "全部完成，干得漂亮。" : `未完成 ${n} 项`;

  btnClear.hidden = completedCount() === 0;

  for (const todo of items) {
    const li = document.createElement("li");
    li.className = `todo-item${todo.done ? " done" : ""}`;
    li.dataset.id = todo.id;

    const wrapCheck = document.createElement("div");
    wrapCheck.className = "check-wrap";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = todo.done;
    cb.setAttribute("aria-label", todo.done ? "标记为未完成" : "标记为已完成");
    cb.addEventListener("change", () => {
      todo.done = cb.checked;
      save();
      render();
    });
    wrapCheck.appendChild(cb);

    const titleWrap = document.createElement("div");
    titleWrap.className = "title-wrap";

    const span = document.createElement("span");
    span.className = "title-display";
    span.textContent = todo.title;
    span.tabIndex = 0;
    span.setAttribute("role", "button");
    span.setAttribute("aria-label", "编辑任务");

    function startEdit() {
      const field = document.createElement("input");
      field.type = "text";
      field.className = "title-edit";
      field.value = todo.title;
      field.maxLength = 200;
      titleWrap.innerHTML = "";
      titleWrap.appendChild(field);
      field.focus();
      field.select();

      const commit = () => {
        const next = field.value.trim();
        if (!next) {
          todos = todos.filter((t) => t.id !== todo.id);
        } else {
          todo.title = next;
        }
        save();
        render();
      };

      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          render();
        }
      });
      field.addEventListener("blur", commit);
    }

    span.addEventListener("click", startEdit);
    span.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startEdit();
      }
    });

    titleWrap.appendChild(span);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn icon";
    del.setAttribute("aria-label", "删除任务");
    del.textContent = "×";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      save();
      render();
    });

    li.append(wrapCheck, titleWrap, del);
    listEl.appendChild(li);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  todos.unshift({ id: uid(), title, done: false });
  input.value = "";
  save();
  render();
  input.focus();
});

btnClear.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const f = chip.getAttribute("data-filter");
    if (!f) return;
    filter = f;
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle("active", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
    });
    render();
  });
});

load();
render();
input.focus();
