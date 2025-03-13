// TO-DO: right-clicks don't register as clicks...

/*

content script which runs on every page after load to
- listen for page events
- add itself to the tree
- add page metadata
- communicate with background script as necessary

content scripts
- handle links clicked directly on a page
- detect when right click occurs and store relevant info

event loop (direct click):
- detect link clicked (URL change)
- get parent ID from page metadata and store in chrome.storage.session
- get TreeNode info from new page, retrieve parent ID from chrome.storage.session
- add the newly-created node to the tree

event loop (right click):
- detect contents of right-clicked node
- write link to "mostRecentLinkClickPageId" in chrome.storage.session
- implementing later

*/

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
document.addEventListener("visibilityChange", () => {
  // if the page has just become focused
  if (document.visibilityState === "visible") {
    // get the page id from the meta element named page-id inside head
    const pageId = document.querySelector('head meta[name="page-id"]').content;
    chrome.storage.session.set({ previousPageId: pageId });
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
