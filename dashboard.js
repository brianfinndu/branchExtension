document.getElementById("nav-active").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("treeRender.html") });
});
