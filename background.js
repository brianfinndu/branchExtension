import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";
import { generateUUID, nilUUID } from "./uuid.js";

// TO-DO: load active tree if toggled
// TO-DO: validate new UUID among user's trees if toggled
let activeTree = new Tree(nilUUID(), {}, []);
let subtreeRoot = "";
let subtreeMap = {};
let subtreeNodes = {};
let rightClickedNodeId = "invalid";
let rightClickedUrl = "";
let currentTreeId = nilUUID();

// Allow content scripts to access tab info
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });
  console.log("Permissions for content scripts modified.");
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-tree-overlay") {
    console.log("Command triggered");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleOverlay" });
      }
    });
  }
});

// When script starts, initialize an empty tree
// TO-DO: change this to load tree from persistent storage
chrome.runtime.onStartup.addListener(function () {
  console.log("Startup script launching.");
  activeTree = new Tree(generateUUID(), {}, []);
});

// Keep script alive
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

// Handle forced script unload
chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension unloading.");
  // TO-DO: save tree to persistent storage
});

// Messaging handlers
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handle messages from content scripts requesting node add
  if (message.action === "addNode") {
    let nodeData = message.nodeData;
    if (!(nodeData.parentId in activeTree.nodes)) {
      nodeData.parentId = "00000000-0000-0000-0000-000000000000";
    }
    let contentType = "link";
    if (nodeData.hasOwnProperty("contentType")) {
      contentType = nodeData.contentType;
    }
    let visited = true;
    if (nodeData.hasOwnProperty("visited")) {
      visited = nodeData.visited;
    }
    let expanded = true;
    if (nodeData.hasOwnProperty("expanded")) {
      expanded = nodeData.expanded;
    }
    let newNode = new TreeNode(
      nodeData.id,
      nodeData.parentId,
      nodeData.url,
      nodeData.timestamp,
      nodeData.title,
      nodeData.favicon,
      contentType,
      visited,
      expanded
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
  // Handle messages from Branch requesting renaming tree
  if (message.action === "editTreeName") {
    if (activeTree.id === message.treeId) {
      activeTree.name = message.newName;
      chrome.storage.local.set({ activeTree });
      chrome.runtime.sendMessage({ action: "renderNeeded" });
    }
    return;
  }

  // Handle messages from Branch requesting tree movement
  if (message.action === "moveTree") {
    activeTree.moveTree(message.rootId, message.newParentId);
  }

  // Handle message from Branch requesting single node movement
  if (message.action === "moveNode") {
    activeTree.moveNode(message.nodeId, message.newParentId);
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
  if (message.action === "toggleExpanded") {
    activeTree.nodes[message.nodeId].expanded =
      !activeTree.nodes[message.nodeId].expanded;
    chrome.runtime.sendMessage({ action: "renderNeeded" });
  }

  if (message.action === "importTree") {
    let tree = message.treePOJO;

    for (const key in tree.nodes) {
      const currentNode = tree.nodes[key];
      tree.nodes[key] = new TreeNode(
        currentNode.id,
        currentNode.parentId,
        currentNode.url,
        currentNode.timestamp,
        currentNode.title,
        currentNode.favicon,
        currentNode.contentType,
        currentNode.visited,
        currentNode.expanded
      );
    }

    activeTree.id = tree.id;
    activeTree.nodeMap = tree.nodeMap;
    activeTree.nodes = tree.nodes;
    console.log("Import successful!");
  }

  if (message.action === "editNodeName") {
    activeTree.editNode(rightClickedNodeId, "title", message.newName);
    chrome.runtime.sendMessage({ action: "renderNeeded" });
  }

  if (message.action === "renameCurrentTree") {
    activeTree.name = message.newName;
    chrome.runtime.sendMessage({ action: "renderNeeded" });
  }

  if (message.action === "writeCurrentToDrive") {
    try {
      chrome.identity.getAuthToken({ interactive: false }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          console.alert("Auth failed. " + chrome.runtime.lastError.message);
        } else {
          await fetch(
            `https://www.googleapis.com/drive/v3/files/${currentTreeId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const folderId = await getOrCreateBranchFolder();
          console.log("Folder ID: " + folderId);
          await uploadTreeToDrive(token, folderId);
          console.log("Tree uploaded to Drive.");
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
});

// Context menu handlers
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu item clicked");
  if (rightClickedNodeId === "invalid") {
    console.log("Attempted to manipulate invalid node.");
    return;
  }

  if (info.menuItemId === "renameNode") {
    chrome.runtime.sendMessage({
      action: "promptForNewName",
      parentId: rightClickedNodeId,
    });
  }
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
      rightClickedUrl, // title...
      "", // favicon...
      "link",
      false,
      true
    );
    activeTree.addNode(newNode);
  }
  if (info.menuItemId === "copySubtree") {
    subtreeRoot = rightClickedNodeId;
    subtreeNodes = {};
    subtreeMap = {};

    let nodeQueue = [rightClickedNodeId];
    while (nodeQueue.length > 0) {
      let numQueueElements = nodeQueue.length;

      for (let i = 0; i < numQueueElements; i++) {
        // make a copy of the node from the id
        let oldNode = activeTree.nodes[nodeQueue[i]];
        let newNode = new TreeNode(
          oldNode.id,
          oldNode.parentId,
          oldNode.url,
          oldNode.timestamp,
          oldNode.title,
          oldNode.favicon,
          oldNode.contentType,
          oldNode.visited,
          oldNode.expanded
        );

        // insert copy to temp nodes object
        subtreeNodes[oldNode.id] = newNode;

        // add parent-child mappings from active tree to temp
        // add child ids to end of queue
        subtreeMap[oldNode.id] = [];
        for (const childId of activeTree.nodeMap[oldNode.id]) {
          subtreeMap[oldNode.id].push(childId);
          nodeQueue.push(childId);
        }
      }

      // slice old nodes off of queue
      nodeQueue = nodeQueue.slice(numQueueElements);
    }

    console.log(subtreeRoot);
    console.log(subtreeMap);
    console.log(subtreeNodes);
  }
  if (info.menuItemId === "pasteSubtree") {
    if (
      !subtreeRoot ||
      Object.keys(subtreeNodes).length === 0 ||
      Object.keys(subtreeMap).length === 0
    ) {
      return;
    }
    let oldToNew = {};
    oldToNew[subtreeNodes[subtreeRoot].parentId] = rightClickedNodeId;
    let nodeQueue = [subtreeRoot];
    while (nodeQueue.length > 0) {
      let numQueueElements = nodeQueue.length;

      for (let i = 0; i < numQueueElements; i++) {
        let newUUID = activeTree.getUniqueId();

        // map old id to newly generated
        oldToNew[nodeQueue[i]] = newUUID;

        // clone old node with new UUID and new parent
        let oldNode = subtreeNodes[nodeQueue[i]];
        let newNode = new TreeNode(
          newUUID,
          oldToNew[oldNode.parentId],
          oldNode.url,
          oldNode.timestamp,
          oldNode.title,
          oldNode.favicon,
          oldNode.contentType,
          oldNode.visited,
          oldNode.expanded
        );

        // add the cloned node to the tree
        // this handles retroactively updating the parent's children mapping
        activeTree.addNode(newNode);

        for (const childId of subtreeMap[oldNode.id]) {
          nodeQueue.push(childId);
        }
      }

      nodeQueue = nodeQueue.slice(numQueueElements);
      chrome.runtime.sendMessage({ action: "renderNeeded" });
    }
  }
});

async function getOrCreateBranchFolder(token) {
  const query = encodeURIComponent(
    "name = 'branch-tree-jsons' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (data.files && data.files.length > 0) {
    // Folder found
    console.log("Folder detected.");
    return data.files[0].id;
  }

  return await createBranchFolder(token);
}

async function createBranchFolder(token) {
  const metadata = {
    name: "branch-tree-jsons",
    mimeType: "application/vnd.google-apps.folder",
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  console.log("Folder created.");
  return data.id;
}

async function uploadTreeToDrive(token, folderId) {
  const treeData = JSON.stringify(activeTree);

  const metadata = {
    name: activeTree.name + ".json",
    mimeType: "application/json",
    parents: [folderId],
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const body =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    treeData +
    closeDelim;

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    console.log("Write to Drive failed.");
  }

  const responseJson = await uploadRes.json();
  console.log(responseJson);
  currentTreeId = responseJson.id;
  return responseJson;
}
