// write function for depth-first traversal

// tree rendered as unordered list
// each item is a list item followed by a possibly empty unordered list

document.getElementById("render-btn").addEventListener("click", renderTree);

var depth = 0;
var nodeList = [];

async function renderTree() {
  // Reset recursion values
  depth = 0;
  nodeList = [];

  // Fetch active tree
  chrome.storage.session.get("activeTree", function (result) {
    activeTree = result.activeTree;

    // DFS tree, place results including indents in nodeList
    dfs(0, activeTree.nodeMap, activeTree.nodes);

    console.log(nodeList);

    console.log("Now attaching children");

    var root = document.getElementById("root");

    nodeList.forEach((element) => {
      let newNode = document.createElement("li");
      let indentText = "";
      for (let step = 0; step < element[1] - 1; step++) {
        indentText += "☆    ";
      }
      newNode.innerHTML = indentText + element[0];
      root.appendChild(newNode);
    });

    root.removeChild(root.firstChild);
  });
}

function dfs(id, map, list) {
  nodeList.push([list[id].title, depth]);

  depth += 1;

  map[id].forEach((element) => {
    dfs(element, map, list);
  });

  depth -= 1;
}

/*

L Wikipedia
L____ Pasadena
L________ LA County

*/
