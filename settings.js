const textOptions = [
  ["new tree on startup", "last active tree on startup"],
  ["light mode", "dark mode", "custom color mode"],
];

const toggleIds = ["startup-text", "color-mode-text"];
let indices = [0, 0];

document.getElementById("startup-left").addEventListener("click", () => {
  changeText(0, -1);
});
document.getElementById("startup-right").addEventListener("click", () => {
  changeText(0, 1);
});
document.getElementById("color-mode-left").addEventListener("click", () => {
  changeText(1, -1);
});
document.getElementById("color-mode-right").addEventListener("click", () => {
  changeText(1, 1);
});

function changeText(index, direction) {
  const textElement = document.getElementById(toggleIds[index]);
  let newValue =
    (indices[index] + direction + textOptions[index].length) %
    textOptions[index].length;
  indices[index] = newValue;
  textElement.textContent = textOptions[index][newValue];

  // Theme toggle logic
  if (index === 1) {
    const customColors = document.getElementById("customColors");

    // Show/hide color pickers
    customColors.style.display = newValue === 2 ? "block" : "none";

    // Toggle dark mode
    const isDarkMode = newValue === 1;
    document.documentElement.classList.toggle("dark-mode", isDarkMode);

    chrome.storage.sync.set({ darkMode: isDarkMode });
    chrome.runtime.sendMessage({
      action: "toggleDarkMode",
      enabled: isDarkMode,
    });
  }
}

document.getElementById("colorPickerSpan0").addEventListener("click", () => {
  openColorPicker(0);
});
document.getElementById("colorPickerSpan1").addEventListener("click", () => {
  openColorPicker(1);
});
document.getElementById("colorPickerSpan2").addEventListener("click", () => {
  openColorPicker(2);
});
document.getElementById("colorPickerSpan3").addEventListener("click", () => {
  openColorPicker(3);
});
document.getElementById("colorPickerSpan4").addEventListener("click", () => {
  openColorPicker(4);
});

// Function for color picker
function openColorPicker(index) {
  document.getElementById(`colorPicker${index}`).click();
}

document.getElementById("colorPicker0").addEventListener("change", () => {
  changeColor(0);
});
document.getElementById("colorPicker1").addEventListener("change", () => {
  changeColor(1);
});
document.getElementById("colorPicker2").addEventListener("change", () => {
  changeColor(2);
});
document.getElementById("colorPicker3").addEventListener("change", () => {
  changeColor(3);
});
document.getElementById("colorPicker4").addEventListener("change", () => {
  changeColor(4);
});

// Function to change colors
function changeColor(index) {
  const picker = document.getElementById(`colorPicker${index}`);
  document.querySelectorAll(".color-option")[index].style.backgroundColor =
    picker.value;
}

/*
// Function for custom colors
window.addEventListener("DOMContentLoaded", () => {
  const currentMode = document.getElementById("text1").textContent;
  document.getElementById("customColors").style.display =
    currentMode === "custom" ? "block" : "none";
});
*/

// Function to change key of shortcut (just the text)
const keyInput = document.getElementById("shortcut-key");
keyInput.addEventListener("input", (e) => {
  let text = keyInput.textContent.trim().toUpperCase();
  // Only allow single character
  if (text.length > 1) {
    text = text.charAt(0);
  }
  keyInput.textContent = text;
});
