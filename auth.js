const USERS_KEY = "studentdo_users";
const SESSION_KEY = "studentdo_session";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeUser = document.getElementById("welcomeUser");

const isLoginPage = window.location.pathname.endsWith("login.html");
const isRegisterPage = window.location.pathname.endsWith("register.html");
const isIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

initAuthFlow();

function initAuthFlow() {
    const session = getSession();

    if (isIndexPage && !session) {
        window.location.href = "login.html";
        return;
    }

    if ((isLoginPage || isRegisterPage) && session) {
        window.location.href = "index.html";
        return;
    }

    if (isIndexPage && session && welcomeUser) {
        welcomeUser.textContent = `Signed in as ${session.name}`;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = "login.html";
        });
    }

    if (registerForm) {
        const passwordInput = document.getElementById("password");
        if (passwordInput) {
            updatePasswordStrengthUI(passwordInput.value);
            passwordInput.addEventListener("input", (event) => {
                updatePasswordStrengthUI(event.target.value);
            });
        }
        registerForm.addEventListener("submit", handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("registerMessage");

    if (!name || !email || !password || !confirmPassword) {
        return renderMessage(message, "All fields are required.", "error");
    }

    if (!isPasswordStrong(password)) {
        return renderMessage(message, "Password must be at least 8 characters and include a number and a special character.", "error");
    }

    if (password !== confirmPassword) {
        return renderMessage(message, "Passwords do not match.", "error");
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
        return renderMessage(message, "Email is already registered.", "error");
    }

    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
    renderMessage(message, "Registration successful. Redirecting...", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 600);
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    if (!email || !password) {
        return renderMessage(message, "Enter both email and password.", "error");
    }

    const users = getUsers();
    const matched = users.find((user) => user.email === email && user.password === password);

    if (!matched) {
        return renderMessage(message, "Invalid credentials.", "error");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: matched.name, email: matched.email }));
    renderMessage(message, "Login successful. Redirecting...", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 400);
}

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

function renderMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.classList.remove("error", "success");
    if (type) element.classList.add(type);
}

function getPasswordRules(password) {
    return {
        length: password.length >= 8,
        number: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

function isPasswordStrong(password) {
    const rules = getPasswordRules(password);
    return rules.length && rules.number && rules.special;
}

function updatePasswordStrengthUI(password) {
    const ruleLength = document.getElementById("rule-length");
    const ruleNumber = document.getElementById("rule-number");
    const ruleSpecial = document.getElementById("rule-special");

    if (!ruleLength || !ruleNumber || !ruleSpecial) return;

    const rules = getPasswordRules(password);

    setRuleState(ruleLength, rules.length);
    setRuleState(ruleNumber, rules.number);
    setRuleState(ruleSpecial, rules.special);
}

function setRuleState(ruleElement, isValid) {
    ruleElement.classList.toggle("valid", isValid);
    ruleElement.classList.toggle("invalid", !isValid);
    const icon = ruleElement.querySelector(".rule-icon");
    if (icon) icon.textContent = isValid ? "✔" : "✖";
}
