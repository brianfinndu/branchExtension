// TO-DO: add functionality to *not* add nodes on certain conditions,
// e.g., when the page is opened from active tree page or is just being
// scraped for title and favicon.

// TO-DO: change message-passing scheme to prompt user for name of unvisited
// node (default to the text content of the right-clicked link).

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await chrome.runtime.sendMessage({ action: "getId" });

    if (response && response.uniqueId !== undefined) {
      const metaTag = document.createElement("meta");
      metaTag.name = "page-id";
      metaTag.content = response.uniqueId;
      document.head.appendChild(metaTag);

      chrome.storage.session.get("previousPageId", function (result) {
        let parentId = result.previousPageId;
        // if new page was not opened by a link click
        if (document.referrer === "") {
          console.log("Parent ID set to root.");
          parentId = "00000000-0000-0000-0000-000000000000";
        }
        console.log("Previous page ID fetched.");
        console.log(result.previousPageId);

        let faviconUrl = "";
        const linkTags = document.getElementsByTagName("link");
        for (let link of linkTags) {
          if (link.rel === "icon" || link.rel === "shortcut icon") {
            faviconUrl = link.href;
            break;
          }
        }

        let newNode = {
          id: response.uniqueId,
          parentId: parentId,
          url: document.location.href,
          timestamp: new Date().toISOString(),
          title: document.title,
          favicon: faviconUrl,
          contentType: "link",
          visited: true,
          expanded: true,
        };

        console.log(newNode);

        if (document.visibilityState === "visible") {
          console.log(
            "Page has loaded and is visible. Setting previousPageId."
          );
          chrome.storage.session.set({ previousPageId: response.uniqueId });
        }

        chrome.runtime.sendMessage({ action: "addNode", nodeData: newNode });
      });
    } else {
      console.warn("No ID received.");
    }
  } catch (error) {
    console.error("Error with ID", error);
  }
});

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    // get the page id from the meta element named page-id inside head
    const metaTag = document.querySelector('head meta[name="page-id"]');

    let pageId;
    if (!metaTag) {
      try {
        const response = await chrome.runtime.sendMessage({ action: "getId" });
        if (response && response.uniqueId !== undefined) {
          const newMetaTag = document.createElement("meta");
          newMetaTag.name = "page-id";
          newMetaTag.content = response.uniqueId;
          document.head.appendChild(newMetaTag);
          const parentId = "00000000-0000-0000-0000-000000000000";
          let faviconUrl = "";
          const linkTags = document.getElementsByTagName("link");
          for (let link of linkTags) {
            if (link.rel === "icon" || link.rel === "shortcut icon") {
              faviconUrl = link.href;
              break;
            }
          }

          let newNode = {
            id: response.uniqueId,
            parentId: parentId,
            url: document.location.href,
            timestamp: new Date().toISOString(),
            title: document.title,
            favicon: faviconUrl,
            contentType: "link",
            visited: true,
            expanded: true,
          };

          console.log(newNode);

          chrome.storage.session.set({ previousPageId: response.uniqueId });
          chrome.runtime.sendMessage({ action: "addNode", nodeData: newNode });
        }
      } catch (error) {
        console.log("Error with meta tag", error);
      }
    } else {
      pageId = metaTag.content;
    }

    chrome.storage.session.set({ previousPageId: pageId });
    chrome.runtime.sendMessage({ action: "setContentScriptContextMenu" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleOverlay") {
    const existingOverlay = document.getElementById("tree-overlay-frame");
    if (existingOverlay) {
      existingOverlay.remove();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.id = "tree-overlay-frame";
    iframe.src = chrome.runtime.getURL("treeRender.html");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.style.zIndex = "999999";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
    iframe.style.opacity = 0.9;

    document.body.appendChild(iframe);
  }
});

/*
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
*/

document.addEventListener("contextmenu", (event) => {
  const link = event.target.closest("a[href]");
  let url = "";
  if (link) {
    url = link.href;
  }

  let metaTag = document.querySelector('head meta[name="page-id"]');

  if (!metaTag) {
    console.log("Meta tag not found, context menu item cannot be generated.");
    return;
  }

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
