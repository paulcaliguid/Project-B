const storageKey = "signal-tasks";
const streakKey = "signal-streak";
const completedKey = "signal-completed";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const clearCompleted = document.getElementById("clearCompleted");
const clearAll = document.getElementById("clearAll");
const streakValue = document.getElementById("streakValue");
const completedValue = document.getElementById("completedValue");

let tasks = [];
let filter = "all";

const todayStamp = () => new Date().toISOString().slice(0, 10);

const loadState = () => {
  const raw = localStorage.getItem(storageKey);
  tasks = raw ? JSON.parse(raw) : [];
};

const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
};

const updateMetrics = () => {
  const completedCount = tasks.filter(task => task.completed).length;
  const remaining = tasks.length - completedCount;
  taskCount.textContent = `${remaining} active tasks`;
  completedValue.textContent = completedCount;

  const streakData = JSON.parse(localStorage.getItem(streakKey) || "{}");
  const today = todayStamp();
  const lastDone = streakData.lastDone;

  if (completedCount > 0 && lastDone !== today) {
    const lastDate = lastDone ? new Date(lastDone) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDate && lastDate.toDateString() === yesterday.toDateString();
    streakData.count = isConsecutive ? (streakData.count || 0) + 1 : 1;
    streakData.lastDone = today;
    localStorage.setItem(streakKey, JSON.stringify(streakData));
  }

  streakValue.textContent = `${streakData.count || 0} days`;
};

const applyFilter = task => {
  if (filter === "active") return !task.completed;
  if (filter === "done") return task.completed;
  return true;
};

const renderTasks = () => {
  taskList.innerHTML = "";
  const visibleTasks = tasks.filter(applyFilter);

  visibleTasks.forEach((task, index) => {
    const item = document.createElement("li");
    item.className = `task${task.completed ? " completed" : ""}`;
    item.style.setProperty("--delay", `${index * 40}ms`);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.text;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const created = new Date(task.createdAt).toLocaleDateString();
    meta.textContent = `Added ${created}`;

    content.appendChild(title);
    content.appendChild(meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeTask(task.id));

    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(remove);

    taskList.appendChild(item);
  });

  emptyState.style.display = visibleTasks.length === 0 ? "block" : "none";
  updateMetrics();
};

const addTask = text => {
  const task = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now()
  };
  tasks.unshift(task);
  saveState();
  renderTasks();
};

const toggleTask = id => {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveState();
  renderTasks();
};

const removeTask = id => {
  tasks = tasks.filter(task => task.id !== id);
  saveState();
  renderTasks();
};

const clearCompletedTasks = () => {
  tasks = tasks.filter(task => !task.completed);
  saveState();
  renderTasks();
};

const clearAllTasks = () => {
  tasks = [];
  localStorage.removeItem(storageKey);
  renderTasks();
};

const setFilter = nextFilter => {
  filter = nextFilter;
  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.filter === filter);
  });
  renderTasks();
};

const initCompletedCounter = () => {
  const stored = Number(localStorage.getItem(completedKey) || 0);
  const completedCount = tasks.filter(task => task.completed).length;
  const nextValue = Math.max(stored, completedCount);
  localStorage.setItem(completedKey, nextValue);
  completedValue.textContent = nextValue;
};

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const value = taskInput.value.trim();
  if (!value) return;
  addTask(value);
  taskInput.value = "";
  taskInput.focus();
});

clearCompleted.addEventListener("click", clearCompletedTasks);
clearAll.addEventListener("click", clearAllTasks);

Array.from(document.querySelectorAll(".chip")).forEach(chip => {
  chip.addEventListener("click", () => setFilter(chip.dataset.filter));
});

loadState();
initCompletedCounter();
renderTasks();
