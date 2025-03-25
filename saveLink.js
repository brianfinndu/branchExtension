// saveLink.js

import { authenticateUser, saveDataToDrive, loadDataFromDrive } from './googleDrive.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("Branch extension loaded.");

    const dialogBox = document.getElementById("dialog-box");

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save URL";
    document.body.appendChild(saveButton);
    console.log("Save button:", saveButton);
    const viewSavedButton = document.createElement("button");
    viewSavedButton.textContent = "View Saved URLs";
    document.body.appendChild(viewSavedButton);
    console.log("Saved Urls:", viewSavedButton);
    const clearButton = document.createElement("button");
    clearButton.textContent = "clear saved URLs";
    document.body.appendChild(clearButton);

    // Get the active tab's URL and title
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            const url = currentTab.url;
            const title = currentTab.title;

            dialogBox.textContent = `Current Tab URL: ${url}`;
            console.log(`Current Tab URL: ${url}, Title: ${title}`);

            // Save URL Button Click
            saveButton.addEventListener("click", async () => {
                try {
                    const savedPages = await PageService.getPages();
                    const updatedPages = await PageService.savePage(title, url);
                    console.log(`URL saved locally: ${url}`);
                    console.log('testing functionality after saving')

                    // Authenticate and upload URL data to Google Drive
                    const token = await authenticateUser();
                    console.log("Authentication token:", token);

                    const uploadResult = await saveDataToDrive(token, updatedPages);

                    if (uploadResult) {
                        console.log("File successfully uploaded to Google Drive.");
                        alert(`URL saved and uploaded to Google Drive! Total saved URLs: ${updatedPages.length}`);
                    } else {
                        alert("Failed to upload URL to Google Drive.");
                    }
                } catch (error) {
                    console.error("Error saving URL:", error);
                    alert("Failed to save URL.");
                }
            });

            // View Saved URLs Button Click
            viewSavedButton.addEventListener("click", async () => {
                try {
                    const savedPages = await PageService.getPages();

                    if (savedPages.length === 0) {
                        dialogBox.textContent = "No saved URLs found.";
                        return;
                    }

                    dialogBox.innerHTML = "<h3>Saved URLs:</h3>";
                    savedPages.forEach((page, index) => {
                        const pageElement = document.createElement("p");
                        pageElement.textContent = `${index + 1}. ${page.title} - ${page.url}`;
                        dialogBox.appendChild(pageElement);
                    });

                    console.log("Loaded saved URLs:", savedPages);
                } catch (error) {
                    console.error("Error loading saved URLs:", error);
                    dialogBox.textContent = "Error loading saved URLs.";
                }
                clearButton.addEventListener("click", async () => {
                    const savedPages = await PageService.clearPages();

                });
            });
        } else {
            dialogBox.textContent = "No active tab found.";
        }
    });


    viewAppDataButton.addEventListener("click", async () => {
        try {
            const token = await authenticateUser(); // Authenticate user
            console.log("Authenticated token for fetching saved URLs:", token);

            const savedUrls = await loadDataFromDrive(token); // Fetch saved URLs
            console.log("Fetched URLs from Google Drive:", savedUrls);

            dialogBox.innerHTML = "<h3>Stored URLs (Google Drive):</h3>";

            if (!savedUrls || savedUrls.length === 0) {
                dialogBox.innerHTML += "<p>No stored URLs found.</p>";
                return;
            }

            savedUrls.forEach((page, index) => {
                const pageElement = document.createElement("p");
                pageElement.textContent = `${index + 1}. ${page.title} - ${page.url}`;
                dialogBox.appendChild(pageElement);
            });
        } catch (error) {
            console.error("Error fetching saved URLs:", error);
            dialogBox.innerHTML = "<p>Error loading saved URLs.</p>";
        }
    });


});


