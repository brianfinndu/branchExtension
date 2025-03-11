document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.sync.get("darkMode", function (data) {
        if (data.darkMode) {
            document.documentElement.classList.add("dark-mode");
            document.getElementById("text2").textContent = "dark mode"; // Update UI
        }
    });

    // Listen for changes from settings.js
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "toggleDarkMode") {
            document.documentElement.classList.toggle("dark-mode", message.enabled);
            document.getElementById("text2").textContent = message.enabled ? "dark mode" : "light mode";
        }
    });
});
