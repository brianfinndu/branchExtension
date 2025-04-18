// TO-DO: back button...

import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";

let activeTree = new Tree(0, {}, []);
let rightClickedNodeId = -1;
let rightClickedUrl = "";

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
    let contentType = "link";
    if (nodeData.hasOwnProperty("contentType")) {
      contentType = nodeData.contentType;
    }
    let visited = true;
    if (nodeData.hasOwnProperty("visited")) {
      visited = nodeData.visited;
    }
    let newNode = new TreeNode(
      nodeData.id,
      nodeData.parentId,
      nodeData.url,
      nodeData.timestamp,
      nodeData.title,
      nodeData.favicon,
      contentType,
      visited
    );
    activeTree.addNode(newNode);
    if (contentType === "note") {
      chrome.runtime.sendMessage({ action: "renderNeeded" });
    }
    return false;
  }

  // Handle message from content scripts requesting unique Id
  if (message.action === "getId") {
    console.log("ID request received.");
    let uniqueId = activeTree.getUniqueId();
    console.log("Sending ID " + uniqueId);
    sendResponse({ uniqueId: uniqueId });
    return true;
  }

  // Handle messages from Branch requesting The Tree
  if (message.action === "getTree") {
    sendResponse({ activeTree: activeTree });
    return true;
  }

  /*

  // Handle messages from Branch requesting node deletion
  if (message.action === "deleteNode") {
    console.log("Node deletion requested");
    activeTree.deleteNode(message.nodeId, message.parentId);
    notifyTabsNodeDelete(message.nodeId, message.parentId);
  }
  */

  // Handle messages from Branch requesting tree movement
  if (message.action === "moveTree") {
    activeTree.moveTree(message.rootId, message.newParentId);
  }

  // Handle message from Branch requesting single node movement
  if (message.action === "moveNode") {
  }

  if (message.action === "setRightClickedNodeId") {
    rightClickedNodeId = message.nodeId;
  }
  if (message.action === "setRightClickedUrl") {
    rightClickedUrl = message.url;
  }
  if (message.action === "hideContextMenu") {
    chrome.contextMenus.removeAll();
  }
  if (message.action === "setContentScriptContextMenu") {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "addUnvisited",
        title: "Add Unvisited Node",
        contexts: ["all"],
      });
    });
  }
  if (message.action === "importTree") {
    let tree = message.treePOJO;
    let rehydratedNodes = tree.nodes.map(
      (obj) =>
        new TreeNode(
          obj.id,
          obj.parentId,
          obj.url,
          obj.timestamp,
          obj.title,
          obj.favicon,
          obj.visited,
          obj.contentType
        )
    );
    activeTree.id = tree.id;
    activeTree.nodeMap = tree.nodeMap;
    activeTree.nodes = rehydratedNodes;
    console.log("Import successful!");
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu item clicked");
  if (info.menuItemId === "deleteNode") {
    activeTree.deleteNode(rightClickedNodeId);
    chrome.runtime.sendMessage({ action: "renderNeeded" });
  }
  if (info.menuItemId === "deleteTree") {
    activeTree.deleteTree(rightClickedNodeId);
    chrome.runtime.sendMessage({ action: "renderNeeded" });
  }
  if (info.menuItemId === "addNoteNode") {
    chrome.runtime.sendMessage({
      action: "promptForNoteText",
      parentId: rightClickedNodeId,
    });
  }
  if (info.menuItemId === "addUnvisited") {
    const uniqueId = activeTree.getUniqueId();
    let newNode = new TreeNode(
      uniqueId,
      rightClickedNodeId,
      rightClickedUrl,
      "",
      "(unvisited) " + rightClickedUrl, // title...
      "", // favicon...
      "link",
      false
    );
    activeTree.addNode(newNode);
  }
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
