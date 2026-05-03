const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const timeSelect = document.getElementById("timeSelect");
const addBtn = document.getElementById("addBtn");
const filterButtons = document.querySelectorAll(".chip");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const counts = document.getElementById("counts");
const progressBar = document.getElementById("progressBar");
const clearCompletedBtn = document.getElementById("clearCompleted");
const clearAllBtn = document.getElementById("clearAll");
const themeToggle = document.getElementById("themeToggle");

const session = JSON.parse(localStorage.getItem("studentdo_session") || "null");
const storageKey = session?.email ? `tasks_${session.email}` : "tasks";

let tasks = [];
let currentFilter = "all";
let searchTerm = "";
let sortMode = "soon";
let selectedDateFilter = null;

const newId = () => (crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

document.addEventListener("DOMContentLoaded", () => {
    if (!taskList) return;

    loadFromStorage();
    render();
    setInterval(updateTimers, 1000);

    addBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
    filterButtons.forEach((btn) => btn.addEventListener("click", () => setFilter(btn.dataset.filter)));
    searchInput.addEventListener("input", (e) => { searchTerm = e.target.value.toLowerCase(); render(); });
    sortSelect.addEventListener("change", (e) => { sortMode = e.target.value; render(); });
    clearCompletedBtn.addEventListener("click", clearCompleted);
    clearAllBtn.addEventListener("click", clearAll);
    themeToggle.addEventListener("click", toggleTheme);
});

function loadFromStorage() {
    const stored = JSON.parse(localStorage.getItem(storageKey)) || [];
    tasks = stored.map((t) => ({
        id: t.id || newId(),
        text: t.text,
        completed: Boolean(t.completed),
        priority: t.priority || "medium",
        deadline: t.deadline || (Date.now() + 60 * 60 * 1000),
        createdAt: t.createdAt || Date.now()
    }));
    persist();
}

function persist() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return alert("Please enter a task!");

    const minutes = parseInt(timeSelect.value, 10) || 60;
    const task = {
        id: newId(),
        text,
        completed: false,
        priority: prioritySelect.value,
        deadline: Date.now() + minutes * 60 * 1000,
        createdAt: Date.now()
    };

    tasks.push(task);
    persist();
    taskInput.value = "";
    taskInput.focus();
    render();
}

function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === filter));
    render();
}

function getFilteredTasks() {
    return tasks
        .filter((t) => {
            if (currentFilter === "active") return !t.completed && !isExpired(t);
            if (currentFilter === "completed") return t.completed;
            if (currentFilter === "expired") return isExpired(t) && !t.completed;
            return true;
        })
        .filter((t) => t.text.toLowerCase().includes(searchTerm))
        .filter((t) => {
            if (!selectedDateFilter) return true;
            const taskDate = getLocalDateString(new Date(t.deadline));
            return taskDate === selectedDateFilter;
        });
}

function sortTasks(list) {
    const sorted = [...list];
    if (sortMode === "soon") sorted.sort((a, b) => a.deadline - b.deadline);
    if (sortMode === "priority") {
        const weight = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => weight[a.priority] - weight[b.priority]);
    }
    if (sortMode === "new") sorted.sort((a, b) => b.createdAt - a.createdAt);
    return sorted;
}

function render() {
    taskList.innerHTML = "";
    const list = sortTasks(getFilteredTasks());

    if (list.length === 0) {
        taskList.innerHTML = "<li class=\"empty-state\">No tasks yet. Add something productive.</li>";
        updateCounts();
        return;
    }

    list.forEach((task) => {
        const li = document.createElement("li");
        li.className = task.completed ? "completed" : "";

        const main = document.createElement("div");
        main.className = "task-main";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.text;

        const meta = document.createElement("div");
        meta.className = "meta";

        const priority = document.createElement("span");
        priority.className = `badge ${task.priority}`;
        priority.textContent = task.priority;

        const created = document.createElement("span");
        created.className = "pill";
        created.textContent = new Date(task.createdAt).toLocaleString();

        const timer = document.createElement("span");
        timer.className = "timer";
        timer.dataset.id = task.id;

        meta.append(priority, created, timer);
        main.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "actions-row";

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = task.completed ? "Undo" : "Done";
        toggleBtn.className = `complete-btn ${task.completed ? "completed" : ""}`;
        toggleBtn.onclick = () => toggleTask(task.id);

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete";
        delBtn.onclick = () => deleteTask(task.id);

        actions.append(toggleBtn, delBtn);
        li.append(main, actions);
        taskList.appendChild(li);
    });

    updateTimers();
    updateCounts();
}

function isExpired(task) {
    return Date.now() > task.deadline;
}

function updateTimers() {
    tasks.forEach((task) => {
        const timerEl = taskList.querySelector(`.timer[data-id="${task.id}"]`);
        if (!timerEl) return;

        const diff = task.deadline - Date.now();
        if (diff <= 0) {
            timerEl.textContent = "Expired";
            timerEl.classList.add("expired");
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        timerEl.textContent = `${h}h ${m}m ${s}s left`;
    });

    persist();
}

function toggleTask(id) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    tasks[idx].completed = !tasks[idx].completed;
    persist();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    persist();
    render();
}

function clearCompleted() {
    tasks = tasks.filter((t) => !t.completed);
    persist();
    render();
}

function clearAll() {
    if (!confirm("Delete all tasks?")) return;
    tasks = [];
    persist();
    render();
}

function updateCounts() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    counts.textContent = `${total} task${total === 1 ? "" : "s"} • ${done} completed`;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    progressBar.style.width = `${pct}%`;
}

function toggleTheme() {
    document.body.classList.toggle("light");
}

// Helper function to get consistent date string in local timezone
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Calendar functionality
let currentMonth = new Date();

const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

if (calendarDays) {
    prevMonth.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonth.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update header
    monthYear.textContent = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    calendarDays.innerHTML = "";

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const day = createDayElement(dayNum, month - 1, year, true);
        calendarDays.appendChild(day);
    }

    // Current month's days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const day = createDayElement(dayNum, month, year, false);
        calendarDays.appendChild(day);
    }

    // Next month's days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
        const day = createDayElement(dayNum, month + 1, year, true);
        calendarDays.appendChild(day);
    }
}

function createDayElement(dayNum, month, year, isOtherMonth) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    
    if (isOtherMonth) {
        div.classList.add("other-month");
        div.innerHTML = `<span class="calendar-day-number">${dayNum}</span>`;
        return div;
    }

    const dateObj = new Date(year, month, dayNum);
    const dateStr = getLocalDateString(dateObj);
    
    // Count tasks for this date
    const tasksForDate = tasks.filter(t => {
        const taskDate = getLocalDateString(new Date(t.deadline));
        return taskDate === dateStr;
    });

    // Check if today
    const today = getLocalDateString(new Date());
    const isToday = dateStr === today;

    // Check if selected
    const isSelected = selectedDateFilter === dateStr;

    if (isToday) div.classList.add("today");
    if (tasksForDate.length > 0) div.classList.add("has-tasks");
    if (isSelected) div.classList.add("selected");

    const html = `<span class="calendar-day-number">${dayNum}</span>`;
    div.innerHTML = html;
    
    if (tasksForDate.length > 0) {
        const countDiv = document.createElement("span");
        countDiv.className = "calendar-day-count";
        countDiv.textContent = `${tasksForDate.length}`;
        div.appendChild(countDiv);
    }

    div.addEventListener("click", () => {
        if (selectedDateFilter === dateStr) {
            selectedDateFilter = null;
            currentFilter = "all";
            filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === currentFilter));
        } else {
            filterTasksByDate(dateStr);
        }
        renderCalendar();
    });

    return div;
}

function filterTasksByDate(dateStr) {
    selectedDateFilter = dateStr;
    currentFilter = "all";
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === currentFilter));
    render();
}