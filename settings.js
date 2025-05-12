const textOptions = [
    ["new tree on startup", "load last active tree on startup"], 
    ["light mode", "dark mode", "custom"]
];

function changeText(index, direction) {
    const textElement = document.getElementById(`text${index}`);
    const options = textOptions[index];
    let currentIndex = options.indexOf(textElement.textContent);
    currentIndex = (currentIndex + direction + options.length) % options.length;
    const newValue = options[currentIndex];
    textElement.textContent = newValue;

    // Theme toggle logic
    if (index === 1) {
        const customColors = document.getElementById("customColors");

        // Show/hide color pickers
        customColors.style.display = (newValue === "custom") ? "block" : "none";

        // Toggle dark mode
        const isDarkMode = newValue === "dark mode";
        document.documentElement.classList.toggle("dark-mode", isDarkMode);

        chrome.storage.sync.set({ darkMode: isDarkMode });
        chrome.runtime.sendMessage({ action: "toggleDarkMode", enabled: isDarkMode });
    }
}

