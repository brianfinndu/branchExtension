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
});
