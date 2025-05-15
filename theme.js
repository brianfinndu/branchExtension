const colorVars = [
  "--color-primary",
  "--color-secondary",
  "--color-tertiary",
  "--text-dark",
  "--text-light"
];

function applySavedTheme() {
  chrome.storage.sync.get(null, (data) => {
    // Apply dark mode
    if (data.darkMode) {
      document.documentElement.classList.add("dark-mode");
    }

    // Apply custom colors if any
    colorVars.forEach((cssVar, index) => {
      const colorValue = data[`customColor${index}`];
      if (colorValue) {
        document.documentElement.style.setProperty(cssVar, colorValue);
      }
    });
  });
}

applySavedTheme();
