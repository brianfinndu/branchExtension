import { PageService } from './storage.js'; // Import the PageService class

function postKey() {
  let devKey = prompt("Please enter an ID.");
  let devName = prompt("Please enter your name.");
  // this is used for the demo to show we "save stuff"
  let obj = {};
  obj[devKey] = devName;
  chrome.storage.sync
      .set(obj)
      .then(() => {
        console.log("Key value pair created.");
      })
      .then(() => {
        console.log(devKey);
        chrome.storage.sync.get([devKey.toString()]).then((result) => {
          console.log("Result is " + JSON.stringify(result));
        });
      });
}
// CODE TO SAVE AND DISPLAY URLS
postKey();

document.addEventListener("DOMContentLoaded", () => {
  console.log("Branch extension loaded.");
  // adds the button to save url
  const dialogBox = document.getElementById("dialog-box");
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save URL";
  document.body.appendChild(saveButton);
  // creates the view saved url button
  const viewSavedButton = document.createElement("button");
  viewSavedButton.textContent = "View Saved URLs";
  document.body.appendChild(viewSavedButton);

  // Query the active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        const url = currentTab.url;
        const title = currentTab.title;

        dialogBox.textContent = `Current Tab URL: ${url}`;
        console.log(`Current Tab URL: ${url}, Title: ${title}`);

        // Save the URL when the button is clicked
        saveButton.addEventListener("click", async () => {
          try {
            const savedPages = await PageService.savePages(title, url);
            alert(`URL saved successfully! Total saved URLs: ${savedPages.length}`);
          } catch (error) {
            console.error("Error saving URL:", error);
          }
        });

        // Display  URLs when the saved urls button is clicked
        viewSavedButton.addEventListener("click", async () => {
          try {
            const savedPages = await PageService.getPages();
            dialogBox.innerHTML = "<h3>Saved URLs:</h3>";
            savedPages.forEach((page, index) => {
              const pageElement = document.createElement("p");
              pageElement.textContent = `${index + 1}. ${page.title} - ${page.url}`;
              dialogBox.appendChild(pageElement);
            });
          } catch (error) {
            console.error("Error fetching saved URLs:", error);
          }
        });
      } else {
        dialogBox.textContent = "No active tab found.";
      }
    } catch (error) {
      console.error("Error querying tabs:", error);
    }
  });
});
