// TO-DO: back button...

import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";

let activeTree = new Tree(0, {}, []);
let rightClickedNodeId = -1;
let rightClickedUrl = "";
let trees = [];
let nextTreeId = 1;
let activeTreeId = null;

function createInitialTree() {
  const id = nextTreeId++;
  const tree = new Tree(id, {}, []);
  trees[id] = tree;
  activeTreeId = id;
}

function getActiveTree(){
  return trees[activeTreeId]
}
chrome.runtime.onStartup.addListener(createInitialTree);
chrome.runtime.onInstalled.addListener(createInitialTree);
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
    const newNode = new TreeNode(
        message.nodeData.id,
        message.nodeData.parentId,
        message.nodeData.url,
        message.nodeData.timestamp,
        message.nodeData.title,
        message.nodeData.favicon,
        message.nodeData.contentType,
        message.nodeData.visited
    );
    getActiveTree().addNode(newNode);
    // if UI needs re-render:
    chrome.runtime.sendMessage({ action: "renderNeeded" });
    return;
  }

  // Handle message from content scripts requesting unique Id
  if (message.action === "getId") {
    console.log("ID request received.");
    const uid = getActiveTree().getUniqueId();
    sendResponse({ uniqueId: uid });
    return;
  }

  // Handle messages from Branch requesting The Tree
  if (message.action === "getTree") {
    sendResponse({ activeTree: getActiveTree() });
    return;
  }

  if (message.action === "createNewTree") {
    const id = nextTreeId++;
    const tree = new Tree(id, {}, []);
    trees[id] = tree;
    activeTreeId = id;
    sendResponse({ newTreeId: id });
    return;  // done
  }

  if (message.action === "getTreeList") {
    const list = Object.values(trees).map(t => ({
      id: t.id,
      rootTitle: t.nodes[0].title
    }));
    sendResponse({ trees: list });
    return;
  }

  if(message.action === "setActiveTree") {
    const { treeId } = message;
    if (!trees[treeId]) {
      sendResponse({ success: false, error: "No such tree ID" });
    } else {
      activeTreeId = treeId;
      sendResponse({ success: true });
    }
    return;

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