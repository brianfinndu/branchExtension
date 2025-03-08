document.getElementById("render-page-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("treeRender.html") });
});
