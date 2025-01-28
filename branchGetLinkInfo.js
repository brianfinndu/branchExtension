/*
JavaScript functions to read information from Chrome on link visitation.
- Parent URL, or lack thereof (new window/new tab)
- Destination URL
- Destination page title
- Destination favicon
*/

/*
    How to run:
    - Open Chrome Browse and run Branch Extension. Right-click Branch window and click Inspect
    - Navigate to Console tab
    - Start Browsing and Observe the Page Info printed out to Console
    - Issue: when click on a new tab, Branch get terminated.
    - Future plan:
        - Store those information as nodes in a tree
*/

const tabUrlMap = {}; // Map to store the most recent URL of each tab

async function logNavigationDetails(tabId, destinationUrl) {
    try {
        // Get tab details for page title and favicon
        const tab = await getTab(tabId);
            
        // Extract relevant information
        const parentUrl = tabUrlMap[tabId] || "New Window/Tab" // Store parent into hashmap
        const pageTitle = tab.title || "Unknown Title";
        const favicon = tab.favIconUrl || "No Favicon";

        console.log("Clicked Page Detail: ",{
            parentUrl,
            destinationUrl,
            pageTitle,
            favicon
        });

        tabUrlMap[tabId] = destinationUrl;

        // TODO: Store or send this information as nodes
        // e.g., chrome.storage.local.set({ key: value })

    } catch (error) {
        console.error("Error fetching tab details:", error);
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
        delete lastLoggedUrlMap[tabId];
    });
}

getLinkInfo();
