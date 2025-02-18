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

  // Function to create a Tree object from the HTML structure
function createTreeFromHTML() {
    const tree = new Tree();
    const nodes = document.querySelectorAll('.tree-node');
  
    nodes.forEach(node => {
      const id = parseInt(node.getAttribute('data-id'));
      const parentId = parseInt(node.getAttribute('data-parent-id'));
      const title = node.querySelector('.title').textContent;
      const url = "https://example.com"; // Placeholder URL
      const timestamp = new Date().toISOString(); // Current timestamp
      const favicon = "https://example.com/favicon.ico"; // Placeholder favicon
  
      const treeNode = new TreeNode(parentId, url, timestamp, title, favicon);
      tree.addNode(treeNode);
    });
  
    return tree;
  }
  
// Event listener for the download button
document.getElementById('downloadTreeButton').addEventListener('click', () => {
    const tree = createTreeFromHTML(); // Create the tree from the HTML structure
    downloadTreeAsJSON(tree); // Download the tree as a JSON file
  });
