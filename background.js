// TO-DO: back button...
import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";
import { saveTreeToDrive } from "./googleDrive.js";


let activeTree = new Tree(0, {}, []);
let rightClickedNodeId = -1;
let rightClickedUrl = "";
let trees = {};
let nextTreeId = 1;
let activeTreeId = null;

// helper to actually register a new Tree object
function registerTree(name = `Tree ${nextTreeId}`) {
  const id = nextTreeId++;
  const tree = new Tree(id, {}, []);
  trees[id] = { tree, name };
  activeTreeId = id;
  return id;
}

// on install/startup make one default Tree
chrome.runtime.onInstalled.addListener(() => registerTree());
chrome.runtime.onStartup.addListener(() => registerTree());

function getTreeById(id) {
  return trees[id].tree;
}

function getActiveTree(){
  return trees[activeTreeId].tree;
}

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1) Add a node (no response expected)
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

    // 1) Tell your UI to re-render
    chrome.runtime.sendMessage({ action: "renderNeeded" });

    // 2) Auto-save the updated active tree to Drive
    (async () => {
      try {
        // Grab the plain data for the active tree
        const treeObj = trees[activeTreeId];
        const treeData = {
          id:       activeTreeId,
          nodeMap:  getActiveTree().nodeMap,
          nodes:    getActiveTree().nodes,
          name:     treeObj.name
        };
        await saveTreeToDrive(treeObj.name, activeTreeId, treeData);
        console.log("Active tree auto-saved to Drive");
      } catch (err) {
        console.error("Failed auto-saving to Drive:", err);
      }
    })();

    // 3) Respond to the content script immediately
    sendResponse({ success: true });
    return;
  }


  // 2) Get a unique ID (sync response)
  if (message.action === "getId") {
    console.log("ID request received.");
    const uid = getActiveTree().getUniqueId();
    sendResponse({ uniqueId: uid });
    return true;
  }

  // 3) Return the current tree (sync response)
  if (message.action === "getTree") {
    sendResponse({ activeTree: getActiveTree() });
    return;
  }

  // 4) Create a new tree (sync response)
  if (message.action === "createNewTree") {
    const name = message.treeName || `Tree ${nextTreeId}`;
    const id = registerTree(name);
    sendResponse({ newTreeId: id });
    return;
  }

  // 5) List all trees (sync response)
  if (message.action === "getTreeList") {
    const list = Object.entries(trees).map(([id, { name }]) => ({
      id: Number(id),
      name
    }));
    sendResponse({ trees: list });
    return;
  }

  if (message.action === "renameTree") {
    // synchronously rename in our in-memory `trees` object
    const id = message.treeId;
    if (!trees[id]) {
      sendResponse({ success: false, error: "Tree not found" });
    } else {
      trees[id].name = message.newName;
      sendResponse({ success: true });
    }
    return;
  }

  // 6) Receive a snapshot from a tab (sync response)
  if (message.action === "snapshotTree") {
    getActiveTree().nodes = message.nodes;
    sendResponse({ success: true });
    return;
  }

  // 7) Switch the active tree (async)
  if (message.action === "setActiveTree") {
    (async () => {
      // a) Find all open editor tabs
      const allTabs = await chrome.tabs.query({});
      const editors = allTabs.filter(t =>
          t.url?.endsWith("/treeRender.html")
      );

      // b) Ask each to snapshot its state
      await Promise.all(editors.map(tab =>
          new Promise(res =>
              chrome.tabs.sendMessage(tab.id, { action: "snapshotTree" }, res)
          )
      ));

      // c) Flip the active ID
      const newId = message.treeId;
      activeTreeId = newId;

      // d) Tell each tab to load the new tree
      editors.forEach(tab =>
          chrome.tabs.sendMessage(tab.id, {
            action: "loadTree",
            treeId: activeTreeId
          })
      );

      // e) Finally respond to the original sender
      sendResponse({ success: true });
    })();

    // Keep the message channel open for the async sendResponse
    return true;
  }


  if (message.action === "saveActiveTree") {
    (async () => {
      try {
        // pull the active tree and its name
        const treeObj = trees[activeTreeId];
        const data = {
          id: activeTreeId,
          nodeMap: treeObj.tree.nodeMap,
          nodes: treeObj.tree.nodes,
          name: treeObj.name
        };
        await saveTreeToDrive(treeObj.name, activeTreeId, data);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // keep channel open for async sendResponse
  }

  // 8) Other actions (no response expected)
  if (message.action === "moveTree") {
    activeTree.moveTree(message.rootId, message.newParentId);
    return;
  }

  if (message.action === "moveNode") {
    // implement node movement if needed
    return;
  }

  if (message.action === "setRightClickedNodeId") {
    rightClickedNodeId = message.nodeId;
    return;
  }

  if (message.action === "setRightClickedUrl") {
    rightClickedUrl = message.url;
    return;
  }

  if (message.action === "hideContextMenu") {
    chrome.contextMenus.removeAll();
    return;
  }

  if (message.action === "setContentScriptContextMenu") {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "addUnvisited",
        title: "Add Unvisited Node",
        contexts: ["all"],
      });
    });
    return;
  }

  if (message.action === "importTree") {
    const tree = message.treePOJO;
    const rehydratedNodes = tree.nodes.map(obj =>
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
    return;
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