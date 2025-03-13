import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";

let activeTree = new Tree(0, {}, []);

// Allow content scripts to access tab info
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });
  console.log("Permissions for content scripts modified.");
});

// When script starts, initialize an empty tree
// TO-DO: change this to load tree from persistent storage
chrome.runtime.onStartup.addListener(function () {
  console.log("Startup script launching.");
  activeTree = new Tree(0, {}, []);
});

// Keep script alive

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

// Handle forced script unload

chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension unloading.");
  // save tree to persistent storage
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handle messages from content scripts requesting node add
  if (message.action === "addNode") {
    let nodeData = message.nodeData;
    let newNode = new TreeNode(
      nodeData.id,
      nodeData.parentId,
      nodeData.url,
      nodeData.timestamp,
      nodeData.title,
      nodeData.favicon
    );
    activeTree.addNode(newNode);
    return false;
  }

  // Handle message from content scripts requesting unique Id
  if (message.action === "getId") {
    console.log("ID request received.");
    let uniqueId = activeTree.getUniqueId();
    console.log("Sending ID " + uniqueId);
    sendResponse({ uniqueId: uniqueId });
    return false;
  }

  // Handle messages from Branch requesting The Tree
  if (message.action === "getTree") {
    console.log("Sending tree as object");
    sendResponse({ activeTree: activeTree });
  }

  // Handle messages from Branch requesting node deletion
  if (message.action === "deleteNode") {
    console.log("Node deletion requested");
    activeTree.deleteNode(message.nodeId, message.parentId);
    notifyTabsNodeDelete(message.nodeId, message.parentId);
  }

  // Handle message from Branch requesting node movement
});

function notifyTabsNodeDelete(deletedId, newId) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: "nodeDeleted",
        deletedId: deletedId,
        newId: newId,
      });
    }
  });
}
