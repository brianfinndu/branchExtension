import { TreeNode } from "./TreeNode.js";
import { Tree } from "./Tree.js";

/*

Background script:
- Handle pages opened from new tab interface
- Handle pages opened from right-click > open in new tab

document.referrer will be empty in this case
Event loop (new tab):
- Get TreeNode info from new page
- Parent ID will be 0 (root of tree)
- Add the newly-created node to the tree

Event loop (right click):
- Get mostRecentLinkClickPageId from chrome.storage.session
- Get TreeNode info from new page
- Add the newly-created node to the tree
- Implementing later

*/

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });
  console.log("Permissions for content scripts modified.");
});

chrome.runtime.onStartup.addListener(function () {
  console.log("Startup script launching.");
  const emptySet = new Set();
  const newTree = {
    id: 0,
    maxId: 0,
    nodeMap: { 0: [] },
    nodes: [
      {
        id: 0,
        parentId: -1,
        url: "",
        timestamp: new Date(),
        title: "",
        favicon: "",
      },
    ],
  };
  console.log(newTree);
  chrome.storage.session.set({ activeTree: newTree });
  chrome.storage.session.set({ previousPageId: 0 });
  chrome.storage.session.get("activeTree", function (result) {
    console.log(result.activeTree);
  });
});
