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
  
  // Example usage:
  // Assuming `tree` is an instance of your Tree class
  document.getElementById('downloadTreeButton').addEventListener('click', () => {
    const tree = new Tree(); // Replace this with your actual tree instance
    downloadTreeAsJSON(tree);
  });
