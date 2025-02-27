// TO-DO: right-clicks don't register as clicks...

/*

content script which runs on every page after load to
- listen for page events
- add itself to the tree
- add page metadata
- communicate with background script / storage as necessary

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

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.session.get("activeTree", function (result1) {
    // fetch the tree
    let activeTree = result1.activeTree;
    console.log("Tree fetched.");
    console.log(result1);

    // add a meta tag to the page containing the node ID
    const metaTag = document.createElement("meta");
    metaTag.name = "page-id";
    metaTag.content = activeTree.nodes.length;
    document.head.appendChild(metaTag);

    chrome.storage.session.get("previousPageId", function (result2) {
      // fetch the parent ID (ID from page where link was clicked)
      let parentId = result2.previousPageId;
      // if new page was not opened by a link click
      if (document.referrer === "") {
        console.log("Parent ID set to 0.");
        parentId = 0;
      }
      console.log("Previous page ID fetched.");
      console.log(result2.previousPageId);
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
        id: activeTree.nodes.length,
        parentId: parentId,
        url: document.location.href,
        timestamp: new Date(),
        title: document.title,
        favicon: faviconUrl,
      };

      // add the node to the tree
      activeTree.nodes.push(newNode);
      activeTree.nodeMap[newNode.id] = [];
      activeTree.nodeMap[newNode.parentId].push(newNode.id);

      console.log(activeTree);

      // write the tree back to chrome.storage.session
      chrome.storage.session.set({ activeTree: activeTree });
    });
  });
});

// general click event listener for entire page
document.addEventListener("click", function (event) {
  // get the page id from the meta element named page-id inside head
  const pageId = document.querySelector('head meta[name="page-id"]').content;
  console.log(pageId);
  chrome.storage.session.set({ previousPageId: pageId });
  // give 200ms for the page ID to be stored, then navigate
});
