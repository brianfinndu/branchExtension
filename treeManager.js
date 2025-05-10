function renderTreeList(trees) {
    const container = document.getElementById("tree-list");
    container.innerHTML = "";

    trees.forEach(tree => {
        const div = document.createElement("div");
        div.className = "tree-entry";

        const title = document.createElement("strong");
        title.textContent = `${tree.name} (ID: ${tree.id})`;

        const renameBtn = document.createElement("button");
        renameBtn.textContent = "Rename";renameBtn.addEventListener("click", () => {
            const newName = prompt("New name for this tree:", tree.name);
            if (!newName) return;
            chrome.runtime.sendMessage(
                { action: "renameTree", treeId: tree.id, newName },
                resp => {
                    if (resp.success) fetchTreeList();
                    else alert("Rename failed: " + resp.error);
                }
            );
        });


        setActiveBtn.addEventListener("click", () => setActive(tree.id));
        const setActiveBtn = document.createElement("button");
        setActiveBtn.textContent = "Set Active";
        setActiveBtn.addEventListener("click", () => setActive(tree.id));

        const exportBtn = document.createElement("button");
        exportBtn.textContent = "Export";
        exportBtn.addEventListener("click", () => exportTree(tree.id));

        div.appendChild(title);
        div.appendChild(setActiveBtn);
        div.appendChild(exportBtn);

        container.appendChild(div);
    });
}

function setActive(treeId) {
    chrome.runtime.sendMessage({ action: "setActiveTree", treeId }, (response) => {
        alert(response.success ? "Tree set as active." : `Failed: ${response.error}`);
    });
}

function exportTree(treeId) {
    chrome.runtime.sendMessage({ action: "setActiveTree", treeId }, () => {
        chrome.runtime.sendMessage({ action: "getTree" }, (response) => {
            const blob = new Blob(
                [JSON.stringify(response.activeTree, null, 2)],
                { type: "application/json" }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tree-${treeId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });
}

document.getElementById("create-tree-btn").addEventListener("click", () => {
    const name = prompt("Enter name for new tree", "New Tree");
    chrome.runtime.sendMessage({ action: "createNewTree", treeName: name }, (response) => {
        if (response.newTreeId) {
            alert("New tree created and set active: " + response.newTreeId);
            fetchTreeList();
        }
        function setActive(treeId) {
            chrome.runtime.sendMessage({ action: "setActiveTree", treeId },
                resp => {
                    if (resp.success) fetchTreeList();
                    else alert("Error: " + resp.error);
                }
            );
        }
    });
});

function fetchTreeList() {
    chrome.runtime.sendMessage({ action: "getTreeList" }, (response) => {
        renderTreeList(response.trees);
    });
}

document.addEventListener("DOMContentLoaded", fetchTreeList);
