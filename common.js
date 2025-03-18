document.addEventListener("DOMContentLoaded", function () {
    // Simulate stored value (since chrome.storage.sync doesn't work outside Chrome extensions)
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    
    if (isDarkMode) {
        document.documentElement.classList.add("dark-mode");
        document.getElementById("text2").textContent = "dark mode";
    }

    // Listen for clicks on the toggle (without Chrome messaging)
    document.getElementById("text2").addEventListener("click", function () {
        const newMode = document.documentElement.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", newMode);
        document.getElementById("text2").textContent = newMode ? "dark mode" : "light mode";
    });
});
