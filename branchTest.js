// function postKey() {
//   let devKey = prompt("Please enter an ID.");
//   let devName = prompt("Please enter your name.");

//   let obj = {};
//   obj[devKey] = devName;

//   chrome.storage.sync
//     .set(obj)
//     .then(() => {
//       console.log("Key value pair created.");
//     })
//     .then(() => {
//       console.log(devKey);
//       chrome.storage.sync.get([devKey.toString()]).then((result) => {
//         console.log("Result is " + JSON.stringify(result));
//       });
//     });
// }

// postKey();

// Function to download the tree as a JSON file
function downloadTreeAsJSON(tree, filename = 'tree.json') {
    const jsonString = tree.toJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function createTreeFromHTML() {
    const tree = new Tree();
    const nodes = document.querySelectorAll('.box'); // Selects all tree nodes

    nodes.forEach(node => {
        const id = parseInt(node.getAttribute('data-id'));
        const parentId = parseInt(node.getAttribute('data-parent-id')) || 0; // Default to root if missing
        const title = node.querySelector("h1").textContent.trim();
        const url = "https://example.com"; // Placeholder URL
        const timestamp = new Date().toISOString(); // Current timestamp
        const favicon = "https://example.com/favicon.ico"; // Placeholder favicon

        const treeNode = new TreeNode(null, parentId, url, timestamp, title, favicon);
        tree.addNode(treeNode);
    });

    return tree;
}


  
// Event listener for the download button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('downloadTreeButton').addEventListener('click', () => {
      const tree = createTreeFromHTML();
      downloadTreeAsJSON(tree);
    });
  });
  
// Function to load a tree from a JSON file
function loadTreeFromJSON(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const jsonData = JSON.parse(event.target.result);
        const tree = new Tree();
        
        // Assuming jsonData is an array of nodes
        jsonData.forEach(nodeData => {
            const treeNode = new TreeNode(
                null,  // No need to pass `tree` instance here
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
