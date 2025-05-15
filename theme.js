const cssVars = [
  '--color-primary',
  '--color-secondary',
  '--color-tertiary',
  '--color-dark-text',
  '--color-light-text'
];

// Load and apply saved theme colors
function applyStoredThemeColors() {
  chrome.storage.sync.get(cssVars, (result) => {
    cssVars.forEach((key) => {
      if (result[key]) {
        document.documentElement.style.setProperty(key, result[key]);
      }
    });
  });
}

// Optional: Expose helper for setting a color manually
function setThemeColor(variable, value) {
  document.documentElement.style.setProperty(variable, value);
  chrome.storage.sync.set({ [variable]: value });
}

// Automatically apply theme on page load
document.addEventListener('DOMContentLoaded', applyStoredThemeColors);

// Expose functions if needed elsewhere
window.Theme = {
  applyStoredThemeColors,
  setThemeColor
};
