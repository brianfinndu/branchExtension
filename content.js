// TO-DO: add detectors for pages opened via right-click
// TO-DO: add functionality to *not* add nodes on certain conditions
// TO-DO: change message-passing scheme to prompt user for name of unvisited node

// Helper: safely get meta tag content
function getPageIdMeta() {
  return document.querySelector('head meta[name="page-id"]');
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    console.log("Requesting ID");
    const response = await chrome.runtime.sendMessage({ action: "getId" });
    if (chrome.runtime.lastError) {
      console.error("getId failed:", chrome.runtime.lastError.message);
      return;
    }
    console.log("Received ID:", response.uniqueId);

    if (response.uniqueId !== undefined) {
      // add a meta tag to the page containing the node ID
      let metaTag = getPageIdMeta();
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.name = "page-id";
        document.head.appendChild(metaTag);
      }
      metaTag.content = response.uniqueId;

      chrome.storage.session.get("previousPageId", function (result) {
        let parentId = result.previousPageId;
        if (!document.referrer) {
          parentId = 0;
          console.log("No referrer—parentId set to 0");
        }
        console.log("previousPageId fetched:", result.previousPageId);

        // fetch the URL of the favicon if present
        let faviconUrl = "";
        document.querySelectorAll("link[rel~='icon']").forEach(link => {
          if (!faviconUrl) faviconUrl = link.href;
        });
        console.log("favicon URL:", faviconUrl || "(none)");

        // construct a new node
        const newNode = {
          id:          parseInt(response.uniqueId, 10),
          parentId:    parseInt(parentId, 10),
          url:         location.href,
          timestamp:   new Date().toISOString(),
          title:       document.title,
          favicon:     faviconUrl,
          contentType: "link",
          visited:     true
        };
        console.log("newNode:", newNode);

        // save this ID for the next page load
        if (document.visibilityState === "visible") {
          chrome.storage.session.set({ previousPageId: response.uniqueId });
          console.log("session.previousPageId set to", response.uniqueId);
        }

        // send message to background script to add the node
        chrome.runtime.sendMessage(
            { action: "addNode", nodeData: newNode },
            resp => {
              if (chrome.runtime.lastError) {
                console.error("addNode failed:", chrome.runtime.lastError.message);
              } else if (!resp.success) {
                console.error("addNode error:", resp.error);
              } else {
                console.log("addNode succeeded");
                chrome.runtime.sendMessage({ action: 'renderNeeded' });
              }
            }
        );
      });
    } else {
      console.warn("No ID received from getId");
    }
  } catch (error) {
    console.error("Error in DOMContentLoaded handler:", error);
  }
});

// Update previousPageId and context menu on visibility change
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const metaTag = getPageIdMeta();
    if (!metaTag) {
      console.warn("No page-id meta tag found on visibilitychange, skipping");
      return;
    }
    const pageId = metaTag.content;
    chrome.storage.session.set({ previousPageId: pageId });
    chrome.runtime.sendMessage({ action: "setContentScriptContextMenu" });
  }
});

// Handle deletion updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "nodeDeleted") {
    let metaTag = getPageIdMeta();
    if (metaTag) {
      if (metaTag.content === message.deletedId) {
        metaTag.content = message.newParentId;
      }
    } else {
      console.warn("No meta tag found. Creating meta tag.");
      metaTag = document.createElement("meta");
      metaTag.name = "page-id";
      metaTag.content = message.newParentId;
      document.head.appendChild(metaTag);
    }
  }
});

// Context menu tracking
document.addEventListener("contextmenu", (event) => {
  const link = event.target.closest("a[href]");
  let url = link ? link.href : "";

  const metaTag = getPageIdMeta();
  if (!metaTag) {
    console.warn("No page-id meta tag found on contextmenu");
  } else {
    const pageId = metaTag.content;
    chrome.runtime.sendMessage({ action: "setRightClickedNodeId", nodeId: pageId });
  }

  chrome.runtime.sendMessage({ action: "setRightClickedUrl", url: url });
});

