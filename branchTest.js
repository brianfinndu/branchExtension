document.getElementById("render-page-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("treeRender.html") });
});

// TO-DO: move this into active tree page, and also allow access from tree management
// TO-DO: rename with the id and/or name of the tree
document.getElementById("download-btn").addEventListener("click", async () => {
  chrome.runtime.sendMessage({ action: "getTree" }, (response) => {
    const tree = response.activeTree;
    const jsonString = JSON.stringify(tree, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "treeExport.json";
    a.click();

    URL.revokeObjectURL(url);
  });
  // Save all trees up to Drive
  document.getElementById("save-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "saveTrees" }, (resp) => {
      if (resp.success) {
        alert("All trees saved to Drive!");
      } else {
        alert("Save failed: " + resp.error);
      }
    });
  });

// Load all trees from Drive
  document.getElementById("load-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "loadTrees" }, (resp) => {
      if (resp.success) {
        alert("Trees loaded from Drive! Refreshing view…");
        // trigger re-render of whatever view you need
        chrome.runtime.sendMessage({ action: "renderNeeded" });
      } else {
        alert("Load failed: " + resp.error);
      }
    });
  });

});
