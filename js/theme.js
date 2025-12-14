const THEME_KEY = "pwa_theme";
const btn = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    btn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    btn.textContent = "🌙";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
}

// INIT
const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

btn.addEventListener("click", toggleTheme);