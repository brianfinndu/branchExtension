/*
JavaScript functions to read information from Chrome on link visitation.
- Parent URL, or lack thereof (new window/new tab)
- Destination URL
- Destination page title
- Destination favicon
- Automatically store the data in a tree and upload to Google Drive
*/

const tabUrlMap = {}; // Map to store the most recent URL of each tab

async function logNavigationDetails(tabId, destinationUrl) {
    try {
        // Get tab details for page title and favicon
        const tab = await getTab(tabId);

        // Extract relevant information
        const parentUrl = tabUrlMap[tabId] || "New Window/Tab";
        const pageTitle = tab.title || "Unknown Title";
        const favicon = tab.favIconUrl || "No Favicon";

        console.log("Clicked Page Detail: ", {
            parentUrl,
            destinationUrl,
            pageTitle,
            favicon
        });

        tabUrlMap[tabId] = destinationUrl;

        // Retrieve the stored tree or create a new one
        let tree = await loadTreeFromStorage();
        if (!tree) {
            tree = new Tree(); // Create a new tree if none exists
        }

        // Create a new TreeNode and add it to the tree
        let newNode = new TreeNode(
            tree.id, // Parent node ID
            destinationUrl,
            new Date().toISOString(), // Timestamp
            pageTitle,
            favicon
        );

        tree.addNode(newNode);

        // Save the updated tree to Chrome storage and Google Drive
        await saveTreeToStorage(tree);
        await saveTreeToDrive(tree); // Automatically upload when updated

    } catch (error) {
        console.error("Error fetching tab details or saving tree:", error);
    }
}

// Helper function to get tab details by tab ID
function getTab(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(tab);
            }
        });
    });
}

// Load tree from Chrome storage
function loadTreeFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["treeData"], (result) => {
            if (result.treeData) {
                resolve(JSON.parse(result.treeData));
            } else {
                resolve(null);
            }
        });
    });
}

// Save tree to Chrome storage
function saveTreeToStorage(tree) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ treeData: JSON.stringify(tree) }, () => {
            console.log("Tree saved locally.");
            resolve();
        });
    });
}

// Save tree to Google Drive
async function saveTreeToDrive(treeData) {
    try {
        let accessToken = await authenticateUser();

        let metadata = {
            name: "branch_tree.json",
            mimeType: "application/json"
        };

        let formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        formData.append("file", new Blob([JSON.stringify(treeData)], { type: "application/json" }));

        let response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}` },
            body: formData
        });

        let result = await response.json();
        console.log("Tree saved to Drive:", result);
    } catch (error) {
        console.error("Error saving to Google Drive:", error);
    }
}

// Set up event listeners to track link visits
function getLinkInfo() {
    // Handle new tab creation and link it to the parent tab
    chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
        const parentTabId = details.sourceTabId; // ID of the tab that opened the new tab
        const newTabId = details.tabId; // ID of the newly created tab

        // Map the parent URL to the new tab
        if (tabUrlMap[parentTabId]) {
            tabUrlMap[newTabId] = tabUrlMap[parentTabId];
        }

        console.log("New tab created. Parent URL mapped.");
    });

    // Fallback: Listen for tab updates (e.g., URL changes detected in the tab)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url) {
            console.log("New page clicked!");
            logNavigationDetails(tabId, changeInfo.url);
        }
    });

    // Clean up tab maps when a tab is removed
    chrome.tabs.onRemoved.addListener((tabId) => {
        delete tabUrlMap[tabId];
    });
}

getLinkInfo();