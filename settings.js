const textOptions = [
    ["follow branch on link click", "new tree on same tab"],
    ["new tree on new tab", "reuse existing tab"],
    ["light mode", "dark mode"] // Index 2 is for the dark mode toggle
];

function changeText(index, direction) {
    const textElement = document.getElementById(`text${index}`);
    const options = textOptions[index];
    let currentIndex = options.indexOf(textElement.textContent);
    currentIndex = (currentIndex + direction + options.length) % options.length;
    textElement.textContent = options[currentIndex];

    if (index === 2) { // If the dark mode toggle was clicked
        const isDarkMode = currentIndex === 1; // "dark mode" option is at index 1
        document.documentElement.classList.toggle("dark-mode", isDarkMode);
        chrome.storage.sync.set({ darkMode: isDarkMode });

        // Notify other pages
        chrome.runtime.sendMessage({ action: "toggleDarkMode", enabled: isDarkMode });
    }
}
