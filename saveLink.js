document.addEventListener("DOMContentLoaded", () => {
    console.log("Branch extension loaded.");

    const dialogBox = document.getElementById("dialog-box");

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save URL";
    document.body.appendChild(saveButton);

    const viewSavedButton = document.createElement("button");
    viewSavedButton.textContent = "View Saved URLs";
    document.body.appendChild(viewSavedButton);

    // Get the active tab's URL and title
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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

                    // Avoid duplicate entries
                    if (!savedPages.some(page => page.url === url)) {
                        const updatedPages = await PageService.savePage(title, url);
                        console.log(`URL saved locally: ${url}`);

                        // Attempt to upload to Google Drive
                        const token = await authenticateUser();
                        const uploadResult = await saveDataToDrive(token, updatedPages);

                        if (uploadResult) {
                            console.log("File successfully uploaded to Google Drive.");
                            alert(`URL saved and uploaded to Google Drive! Total saved URLs: ${updatedPages.length}`);
                        } else {
                            alert("Failed to upload URL to Google Drive.");
                        }
                    } else {
                        alert("This URL is already saved.");
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
            });
        } else {
            dialogBox.textContent = "No active tab found.";
        }
    });
});

// Function to authenticate user with Google
async function authenticateUser() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth Error:", chrome.runtime.lastError?.message || "Unknown error");
                reject(chrome.runtime.lastError?.message || "Unknown error");
            } else {
                console.log("Authenticated with token:", token);
                resolve(token);
            }
        });
    });
}

// Get Google Drive File ID (or create if not exists)
async function getDriveFileId(token) {
    const url = "https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json'&spaces=appDataFolder";
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        console.error("Drive API error:", await response.text());
        return null;
    }

    const data = await response.json();
    return data.files.length > 0 ? data.files[0].id : null;
}

// Create or update the file in Google Drive
async function saveDataToDrive(token, urls) {
    let fileId = await getDriveFileId(token);
    console.log("File ID retrieved:", fileId); // Check if fileId is valid

    const metadata = {
        name: "saved_urls.json",
        mimeType: "application/json",
        parents: ["appDataFolder"]
    };

    const fileContent = new Blob([JSON.stringify(urls)], { type: "application/json" });

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", fileContent);

    const url = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    const method = fileId ? "PATCH" : "POST";

    console.log("Making API call to Drive with URL:", url);

    const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    console.log("Response from Drive API:", response); // Check the response object

    if (response.ok) {
        console.log("File successfully saved to Google Drive.");
        return true;
    } else {
        console.error("Failed to save file to Google Drive:", await response.text());
        return false;
    }
}


