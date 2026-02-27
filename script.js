let taskList, taskInput, timeSelect;

// Load tasks on page load
window.onload = () => {
    taskList = document.getElementById("taskList");
    taskInput = document.getElementById("taskInput");
    timeSelect = document.getElementById("timeSelect");

    loadTasks();
    setInterval(updateTimers, 1000);

    taskInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            addTask();
        }
    });
};

function addTask() {
    let taskText = taskInput.value.trim();
    if (taskText === "") {
        alert("Please enter a task!");
        return;
    }

    const minutes = parseInt(timeSelect.value);

    let task = {
        text: taskText,
        completed: false,
        deadline: Date.now() + minutes * 60 * 1000
    };

    saveTask(task);
    taskInput.value = "";
    loadTasks();
}

function saveTask(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    taskList.innerHTML = "";
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    if (tasks.length === 0) {
        taskList.innerHTML = "<p>No tasks yet. Add something productive 🚀</p>";
        return;
    }

    tasks.forEach((task, index) => {
        let li = document.createElement("li");

        let textSpan = document.createElement("span");
        textSpan.textContent = task.text;

        if (task.completed) textSpan.classList.add("completed");

        textSpan.onclick = () => toggleTask(index);

        let delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.className = "delete";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTask(index);
        };

        let timer = document.createElement("div");
        timer.className = "timer";
        timer.id = `timer-${index}`;

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        li.appendChild(timer);
        taskList.appendChild(li);
    });

    updateTimers();
}

function updateTimers() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    tasks.forEach((task, index) => {
        let timerEl = document.getElementById(`timer-${index}`);
        if (!timerEl) return;

        let timeLeft = task.deadline - Date.now();

        if (timeLeft <= 0) {
            timerEl.textContent = "Time expired";
            timerEl.classList.add("expired");
        } else {
            let h = Math.floor(timeLeft / (1000 * 60 * 60));
            let m = Math.floor((timeLeft / (1000 * 60)) % 60);
            let s = Math.floor((timeLeft / 1000) % 60);
            timerEl.textContent = `Time left: ${h}h ${m}m ${s}s`;
        }
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function toggleTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem("tasks", JSON.stringify(tasks));
    loadTasks();
}

function deleteTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    loadTasks();
}

function clearAll() {
    if (confirm("Delete all tasks?")) {
        localStorage.removeItem("tasks");
        loadTasks();
    }
}