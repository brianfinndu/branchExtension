// TO-DO: handle nodes being opened via double-click

// TO-DO: handle a single node being open multiple times...
// incl onMessage listening for node deletion

let hoveringLi = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "snapshotTree") {
    sendResponse({ nodes: myTree.getAllNodes() });
  }
  if (msg.action === "loadTree") {
    loadTree(msg.treeId);
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "deleteNode",
      title: "Delete Node",
      contexts: ["all"],
    });
    chrome.contextMenus.create({
      id: "deleteTree",
      title: "Delete Subtree",
      contexts: ["all"],
    });
    chrome.contextMenus.create({
      id: "addNoteNode",
      title: "Add Note Node",
      contexts: ["all"],
    });
  });

  renderTree();
});

// TO-DO: prevent root movement
// wait doesn't this happen automatically since everything is a root descendant

function traverse(rootIndex, nodeMap, nodes) {
  let ul = document.createElement("ul");
  ul.style.paddingLeft = "20px";

  let li = document.createElement("li");
  li.textContent = nodes[parseInt(rootIndex)].title;
  li.dataset.nodeId = rootIndex;
  li.dataset.url = nodes[parseInt(rootIndex)].url;
  li.dataset.timestamp = nodes[parseInt(rootIndex)].timestamp;
  li.dataset.visited = nodes[parseInt(rootIndex)].visited;
  li.dataset.contentType = nodes[parseInt(rootIndex)].contentType;
  li.draggable = true;

  // set drag start behavior
  li.addEventListener("dragstart", (event) => {
    // create drag image
    event.stopPropagation();
    let dragText = document.createElement("div");
    dragText.textContent = [...event.target.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent);
    dragText.style.position = "absolute";
    dragText.style.top = "-9999px";
    document.body.appendChild(dragText);
    event.dataTransfer.setDragImage(dragText, 0, 0);
    setTimeout(() => document.body.removeChild(dragText), 0);

    // set drag data
    event.dataTransfer.setData("text/plain", rootIndex);
    console.log("Drag started, data set to", rootIndex);
  });

  // set drag end behavior
  li.addEventListener("dragend", (event) => {});

  // set drag over valid target behavior
  li.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  // set drop behavior
  li.addEventListener("drop", async function (event) {
    event.stopPropagation();

    const droppedText = event.dataTransfer.getData("text/plain");

    console.log("Sending moveTree message");

    chrome.runtime.sendMessage({
      action: "moveTree",
      rootId: droppedText,
      newParentId: event.target.closest("li").dataset.nodeId,
    });

    // TO-DO: currently, the entire tree re-renders at this point.
    // instead, implement a diffing algorithm to only re-render affected parts.

    renderTree();
  });

  ul.appendChild(li);

  if (nodeMap[rootIndex].length === 0) {
    let innerUl = document.createElement("ul");
    li.appendChild(innerUl);
    return ul;
  }

  nodeMap[rootIndex].forEach((id) => {
    li.appendChild(traverse(id, nodeMap, nodes));
  });

  return ul;
}

document.addEventListener("mouseover", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  hoveringLi = li;

  const url = document.createElement("p");
  url.textContent = `URL: ${li.dataset.url}`;
  const timestamp = document.createElement("p");
  timestamp.textContent = `Timestamp: ${li.dataset.timestamp}`;
  const visited = document.createElement("p");
  visited.textContent = `Visited: ${li.dataset.visited}`;
  const contentType = document.createElement("p");
  contentType.textContent = `Content type: ${li.dataset.contentType}`;

  let hoverPopup = document.getElementById("hover-popup");
  hoverPopup.appendChild(url);
  hoverPopup.appendChild(timestamp);
  hoverPopup.appendChild(visited);
  hoverPopup.appendChild(contentType);

  hoverPopup.style.display = "block";
});

document.addEventListener("mousemove", (event) => {
  let hoverPopup = document.getElementById("hover-popup");
  if (hoveringLi) {
    hoverPopup.style.top = `${event.clientY + 15}px`;
    hoverPopup.style.left = `${event.clientX + 15}px`;
  }
});

document.addEventListener("mouseout", (event) => {
  if (event.target.closest("li") === hoveringLi) {
    let hoverPopup = document.getElementById("hover-popup");
    hoverPopup.innerHTML = " ";
    hoverPopup.style.display = "none";
    hoveringLi = null;
  }
});

document.addEventListener("contextmenu", (event) => {
  const li = event.target.closest("li");
  let nodeId = -1;

  if (li && li.dataset.nodeId) {
    nodeId = li.dataset.nodeId;
  }

  chrome.runtime.sendMessage({
    action: "setRightClickedNodeId",
    nodeId: nodeId,
  });
});


document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "deleteNode",
        title: "Delete Node",
        contexts: ["all"],
      });
      chrome.contextMenus.create({
        id: "deleteTree",
        title: "Delete Subtree",
        contexts: ["all"],
      });
      chrome.contextMenus.create({
        id: "addNoteNode",
        title: "Add Note Node",
        contexts: ["all"],
      });
    });
  }
});

/*
// no longer needed because making a non-branch tab visible
// now reset the contextMenu and adds the unvisited option.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    chrome.runtime.sendMessage({ action: "hideContextMenu" });
  }
});
*/

// TO-DO: separate renderTree function

async function renderTree() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getTree" });
    console.log(response);
    document.body.innerHTML = "";
    document.body.appendChild(
        traverse("0", response.activeTree.nodeMap, response.activeTree.nodes)
    );
    const hoverPopup = document.createElement("div");
    hoverPopup.id = "hover-popup";
    document.body.appendChild(hoverPopup);
  } catch (error) {
    console.error("Error with rendering", error);
  }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "renderNeeded") {
    renderTree();
  }
  if (message.action === "promptForNoteText") {
    let noteText = prompt("Enter note text: ");
    const response = await chrome.runtime.sendMessage({ action: "getId" });
    const nodeId = response.uniqueId;
    let newNode = {
      id: parseInt(nodeId),
      parentId: message.parentId,
      url: "",
      timestamp: new Date().toISOString(),
      title: noteText,
      favicon: "./images/branchLogo.png",
      contentType: "note",
      visited: true,
    };
    chrome.runtime.sendMessage({ action: "addNode", nodeData: newNode });
  }
});