
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".rename-tree-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const card   = btn.closest(".card");
            const treeId = card.dataset.treeId;
            const titleEl= card.querySelector(".title");
            const oldName= titleEl.textContent.trim();
            const newName= prompt("Enter new name for this tree:", oldName);
            if (!newName || newName === oldName) return;

            // 1) Update the UI immediately
            titleEl.textContent = newName;

            // 2) Tell the background/service-worker to update the model
            chrome.runtime.sendMessage({
                action:   "editTreeName",
                treeId:   treeId,
                newName:  newName
            });
        });
    });
});
