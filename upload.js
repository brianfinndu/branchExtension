document.getElementById("upload-region").addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", function () {
  if (this.files.length > 1) {
    console.log("Only one tree can be uploaded at a time.");
  }
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const treePOJO = JSON.parse(event.target.result);

      chrome.runtime.sendMessage({ action: "importTree", treePOJO: treePOJO });
    } catch (error) {
      console.log("Invalid JSON file. ", err);
    }
  };
  reader.readAsText(file);
});
