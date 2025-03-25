// Function to download the tree as a JSON file
function downloadTreeAsJSON(tree, filename = "tree.json") {
  const jsonString = tree.toJSON();
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createTreeFromHTML() {
  const tree = new Tree();
  const nodes = document.querySelectorAll(".box"); // Selects all tree nodes

  nodes.forEach((node) => {
    const id = parseInt(node.getAttribute("data-id"));
    const parentId = parseInt(node.getAttribute("data-parent-id")) || 0; // Default to root if missing
    const title = node.querySelector("h1").textContent.trim();
    const url = "https://example.com"; // Placeholder URL
    const timestamp = new Date().toISOString(); // Current timestamp
    const favicon = "https://example.com/favicon.ico"; // Placeholder favicon

    const treeNode = new TreeNode(
      null,
      parentId,
      url,
      timestamp,
      title,
      favicon
    );
    tree.addNode(treeNode);
  });

  return tree;
}

// Event listener for the download button
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("downloadTreeButton")
    .addEventListener("click", () => {
      const tree = createTreeFromHTML();
      downloadTreeAsJSON(tree);
    });
});

// Function to load a tree from a JSON file
function loadTreeFromJSON(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const jsonData = JSON.parse(event.target.result);
    const tree = new Tree();

    // Assuming jsonData is an array of nodes
    jsonData.forEach((nodeData) => {
      const treeNode = new TreeNode(
        null, // No need to pass `tree` instance here
        nodeData.parentId,
        nodeData.url,
        nodeData.timestamp,
        nodeData.title,
        nodeData.favicon
      );
      tree.addNode(treeNode);
    });

    // Render the tree inside the extension
    renderTree(tree);
  };

  reader.readAsText(file);
}

/*
function renderTree(tree) {
    const container = document.querySelector("#treeContainer");
    container.innerHTML = ""; // Clear existing tree

    function createNodeElement(node) {
        const nodeElement = document.createElement("div");
        nodeElement.classList.add("box", "p-3");
        nodeElement.setAttribute("data-id", node.id);
        nodeElement.setAttribute("data-parent-id", node.parentId);

        nodeElement.innerHTML = `
            <h1 class="title is-size-6">${node.title}</h1>
            <div class="container">
                <div class="flex-container">
                    <p class="is-size-7">URL: <a href="${node.url}" target="_blank">${node.url}</a></p>
                    <p class="is-size-7">Last Visited: ${new Date(node.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `;
        return nodeElement;
    }

    // Find root nodes (those with parentId = 0)
    const rootNodes = tree.nodes.filter(node => node.parentId === 0);

    function appendChildren(parentElement, parentId) {
        tree.nodes
            .filter(node => node.parentId === parentId)
            .forEach(childNode => {
                const childElement = createNodeElement(childNode);
                parentElement.appendChild(childElement);
                appendChildren(childElement, childNode.id);
            });
    }

    rootNodes.forEach(rootNode => {
        const rootElement = createNodeElement(rootNode);
        container.appendChild(rootElement);
        appendChildren(rootElement, rootNode.id);
    });
}
*/

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("uploadTreeFile")
    .addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        loadTreeFromJSON(file);
      }
    });
});

document.getElementById("render-page-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("treeRender.html") });
});
