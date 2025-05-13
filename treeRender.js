// TO-DO: handle nodes being opened via double-click

// TO-DO: use images for expanded/collapsed
// TO-DO: use image placeholder for consistent spacing when no children

// TO-DO: persistent toggle for node metadata

// TO-DO: handle a single node being open multiple times...
// incl onMessage listening for node deletion

let hoveringNode = null;

document.addEventListener("DOMContentLoaded", async function () {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "renameNode",
      title: "Rename Node",
      contexts: ["all"],
    });
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
    chrome.contextMenus.create({
      id: "copySubtree",
      title: "Copy Subtree",
      contexts: ["all"],
    });
    chrome.contextMenus.create({
      id: "pasteSubtree",
      title: "Paste Subtree",
      contexts: ["all"],
    });
  });

  renderTree();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const popup = document.getElementById("hover-popup");
    if (popup) {
      popup.style.display =
        popup.style.display === "none" || popup.style.display === ""
          ? "block"
          : "none";
    }
  }
});

function traverse(rootIndex, nodeMap, nodes) {
  let ul = document.createElement("ul");
  ul.style.paddingLeft = "30px";

  let li = document.createElement("li");

  let div = document.createElement("div");
  div.classList.add("node");
  let img = document.createElement("img");
  img.src = nodes[rootIndex].favicon;
  img.classList.add("favicon");
  img.onerror = () => {
    img.src = "./images/branchLogo.png";
  };
  div.appendChild(img);

  let linkText = document.createElement("a");
  linkText.href = nodes[rootIndex].url;
  linkText.textContent = nodes[rootIndex].title;
  div.appendChild(linkText);

  if (nodes[rootIndex].visited === false) {
    div.classList.add("unvisited");
  }
  if (nodes[rootIndex].contentType === "note") {
    div.classList.add("note");
  }

  div.dataset.nodeId = rootIndex;
  div.dataset.url = nodes[rootIndex].url;
  div.dataset.timestamp = nodes[rootIndex].timestamp;
  div.dataset.visited = nodes[rootIndex].visited;
  div.dataset.contentType = nodes[rootIndex].contentType;
  div.draggable = true;

  div.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "toggleExpanded",
      nodeId: rootIndex,
    });
  });

  li.appendChild(div);

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

    if (event.shiftKey) {
      chrome.runtime.sendMessage({
        action: "moveNode",
        nodeId: droppedText,
        newParentId: event.target.closest(".node").dataset.nodeId,
      });
    } else {
      chrome.runtime.sendMessage({
        action: "moveTree",
        rootId: droppedText,
        newParentId: event.target.closest(".node").dataset.nodeId,
      });
    }

    // TO-DO: currently, the entire tree re-renders at this point.
    // instead, implement a diffing algorithm to only re-render affected parts.

    renderTree();
  });

  ul.appendChild(li);

  if (!nodes[rootIndex].expanded) {
    div.prepend(document.createTextNode(">"));
    return ul;
  } else {
    div.prepend(document.createTextNode("v"));
  }

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
  const node = event.target.closest(".node");
  if (!node) return;
  hoveringNode = node;

  const url = document.createElement("p");
  url.textContent = `URL: ${node.dataset.url}`;
  const timestamp = document.createElement("p");
  timestamp.textContent = `Timestamp: ${node.dataset.timestamp}`;
  const visited = document.createElement("p");
  visited.textContent = `Visited: ${node.dataset.visited}`;
  const contentType = document.createElement("p");
  contentType.textContent = `Content type: ${node.dataset.contentType}`;

  let hoverPopup = document.getElementById("hover-popup");
  hoverPopup.innerHTML = "";
  hoverPopup.appendChild(url);
  hoverPopup.appendChild(timestamp);
  hoverPopup.appendChild(visited);
  hoverPopup.appendChild(contentType);

  hoverPopup.style.display = "block";
});

document.addEventListener("mousemove", (event) => {
  let hoverPopup = document.getElementById("hover-popup");
  if (hoveringNode) {
    hoverPopup.style.top = `${event.clientY + 15}px`;
    hoverPopup.style.left = `${event.clientX + 15}px`;
  }
});

document.addEventListener("mouseout", (event) => {
  if (event.target.closest(".node") === hoveringNode) {
    let hoverPopup = document.getElementById("hover-popup");
    hoverPopup.innerHTML = "";
    hoverPopup.style.display = "none";
    hoveringNode = null;
  }
});

document.addEventListener("contextmenu", (event) => {
  const node = event.target.closest(".node");
  let nodeId = "invalid";

  if (node && node.dataset.nodeId) {
    nodeId = node.dataset.nodeId;
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
        id: "renameNode",
        title: "Rename Node",
        contexts: ["all"],
      });
      chrome.contextMenus.create({
        id: "addNoteNode",
        title: "Add Note Node",
        contexts: ["all"],
      });
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
        id: "copySubtree",
        title: "Copy Subtree",
        contexts: ["all"],
      });
      chrome.contextMenus.create({
        id: "pasteSubtree",
        title: "Paste Subtree",
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
      traverse(
        "00000000-0000-0000-0000-000000000000",
        response.activeTree.nodeMap,
        response.activeTree.nodes
      )
    );
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
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
      id: nodeId,
      parentId: message.parentId,
      url: "",
      timestamp: new Date().toISOString(),
      title: noteText,
      favicon: "./images/branchLogo.png",
      contentType: "note",
      visited: true,
      expanded: true,
    };
    chrome.runtime.sendMessage({ action: "addNode", nodeData: newNode });
  }

  if (message.action === "promptForNewName") {
    let newName = prompt("Enter new node name: ");
    chrome.runtime.sendMessage({ action: "editNodeName", newName: newName });
  }
});
