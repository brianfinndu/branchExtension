const textOptions = [
  ["follow branch on link click", "new tree on same tab"],
  ["new tree on new tab", "reuse existing tab"],
  ["light mode", "dark mode"],
];

function changeText(index, direction) {
  const textElement = document.getElementById(`text${index}`);
  const options = textOptions[index];
  let currentIndex = options.indexOf(textElement.textContent);
  currentIndex = (currentIndex + direction + options.length) % options.length;
  textElement.textContent = options[currentIndex];
}

function openColorPicker(index) {
  document.getElementById(`colorPicker${index}`).click();
}

function changeColor(index) {
  const picker = document.getElementById(`colorPicker${index}`);
  document.querySelectorAll(".color-option")[index].style.backgroundColor =
    picker.value;
}
