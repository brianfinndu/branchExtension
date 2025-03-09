document.addEventListener("DOMContentLoaded", async function () {
  try {
    // request tree from background script
    const response = await chrome.runtime.sendMessage({ action: "getTree" });

    console.log(response.activeTree.nodeMap);

    document.body.appendChild(
      traverse("0", response.activeTree.nodeMap, response.activeTree.nodes)
    );
  } catch (error) {
    console.error("Error with rendering", error);
  }
});

function traverse(rootIndex, nodeMap, nodes) {
  let ul = document.createElement("ul");
  let li = document.createElement("li");
  li.textContent = nodes[parseInt(rootIndex)].title;
  ul.appendChild(li);

  if (nodeMap[rootIndex].length === 0) {
    let innerUl = document.createElement("ul");
    li.appendChild(innerUl);
    return ul;
  }

  console.log(typeof nodeMap[rootIndex]);

  nodeMap[rootIndex].forEach((id) => {
    li.appendChild(traverse(id, nodeMap, nodes));
  });

  return ul;
}

/*

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

*/
