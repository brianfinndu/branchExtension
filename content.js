// TO-DO: add detectors for pages opened via right-click

// TO-DO: add functionality to *not* add nodes on certain conditions,
// e.g., when the page is opened from active tree page or is just being
// scraped for title and favicon.

// TO-DO: change message-passing scheme to prompt user for name of unvisited
// node (default to the text content of the right-clicked link).

document.addEventListener("DOMContentLoaded", async function () {
  try {
    console.log("Requesting ID");
    const response = await chrome.runtime.sendMessage({ action: "getId" });
    console.log("Received ID: " + response.uniqueId);

    if (response && response.uniqueId !== undefined) {
      // add a meta tag to the page containing the node ID
      const metaTag = document.createElement("meta");
      metaTag.name = "page-id";
      metaTag.content = response.uniqueId;
      document.head.appendChild(metaTag);

      chrome.storage.session.get("previousPageId", function (result) {
        // fetch the parent ID (ID from page where link was clicked)
        let parentId = result.previousPageId;
        // if new page was not opened by a link click
        if (document.referrer === "") {
          console.log("Parent ID set to 0.");
          parentId = 0;
        }
        console.log("Previous page ID fetched.");
        console.log(result.previousPageId);
        // fetch the URL of the favicon from among the link tags
        let faviconUrl = "";
        const linkTags = document.getElementsByTagName("link");
        for (let link of linkTags) {
          if (link.rel === "icon" || link.rel === "shortcut icon") {
            faviconUrl = link.href;
            break;
          }
        }

        // construct a new node from the previous info
        let newNode = {
          id: parseInt(response.uniqueId),
          parentId: parentId,
          url: document.location.href,
          timestamp: new Date().toISOString(),
          title: document.title,
          favicon: faviconUrl,
        };

        console.log(newNode);

        if (document.visibilityState === "visible") {
          console.log(
            "Page has loaded and is visible. Setting previousPageId."
          );
          chrome.storage.session.set({ previousPageId: response.uniqueId });
        }

        // send message to background script to add the node to the tree
        chrome.runtime.sendMessage({ action: "addNode", nodeData: newNode });
      });
    } else {
      console.warn("No ID received.");
    }
  } catch (error) {
    console.error("Error with ID", error);
  }
});

// general click event listener for entire page
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // get the page id from the meta element named page-id inside head
    const pageId = document.querySelector('head meta[name="page-id"]').content;
    chrome.storage.session.set({ previousPageId: pageId });
    chrome.runtime.sendMessage({ action: "setContentScriptContextMenu" });
  }
});

// listen for messages relating to node closure
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "nodeDeleted") {
    let metaTag = document.querySelector('head meta[name="page-id"]');
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

document.addEventListener("contextmenu", (event) => {
  const link = event.target.closest("a[href]");
  let url = "";
  if (link) {
    url = link.href;
  }

  let metaTag = document.querySelector('head meta[name="page-id"]');
  const pageId = metaTag.content;

  chrome.runtime.sendMessage({
    action: "setRightClickedNodeId",
    nodeId: pageId,
  });

  chrome.runtime.sendMessage({
    action: "setRightClickedUrl",
    url: url,
  });
});
