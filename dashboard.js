document.getElementById("nav-active").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("treeRender.html") });
});

document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn = document.getElementById("drive-connection-btn");

  chrome.identity.getAuthToken({ interactive: false }, async (token) => {
    if (chrome.runtime.lastError || !token) {
      // User has not currently authorized Drive connection
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect to Drive";
      connectBtn.addEventListener("click", () => {
        chrome.identity.getAuthToken(
          { interactive: true },
          async (newToken) => {
            if (chrome.runtime.lastError || !newToken) {
              console.alert("Auth failed. ", chrome.runtime.lastError.message);
              return;
            }
            connectBtn.disabled = true;
            connectBtn.textContent = "Connected to Drive!";
            connectBtn.className = "tree-button-disabled";
            const folderId = await getOrCreateBranchFolder(newToken);
            console.log(folderId);
          }
        );
      });
    } else {
      connectBtn.disabled = true;
      connectBtn.textContent = "Connected to Drive!";
      connectBtn.className = "tree-button-disabled";
      const folderId = await getOrCreateBranchFolder(token);
      console.log(folderId);
    }
  });
});

async function getOrCreateBranchFolder(token) {
  const query = encodeURIComponent(
    "name = 'branch-tree-jsons' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (data.files && data.files.length > 0) {
    // Folder found
    console.log("Folder detected.");
    return data.files[0].id;
  }

  return await createBranchFolder(token);
}

async function createBranchFolder(token) {
  const metadata = {
    name: "branch-tree-jsons",
    mimeType: "application/vnd.google-apps.folder",
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  console.log("Folder created.");
  return data.id;
}
