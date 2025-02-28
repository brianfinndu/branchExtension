chrome.runtime.onInstalled.addListener(() => {
    console.log("Branch Extension installed.");
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
    const url = "https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json' and 'appDataFolder' in parents";
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

    const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    if (response.ok) {
        console.log("File successfully saved to Google Drive.");

        // Verify if the file was uploaded
        const fileExists = await checkFileExists(token);
        if (fileExists) {
            console.log("Upload confirmed: File exists in Google Drive.");
        } else {
            console.log("Upload failed: File not found.");
        }

        return true;
    } else {
        console.error("Failed to save file to Google Drive:", await response.text());
        return false;
    }
}

// Check if the file exists on Google Drive
async function checkFileExists(token) {
    // Query to check if 'saved_urls.json' exists in appDataFolder
    const url = "https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json' and 'appDataFolder' in parents";

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            console.log("File exists in Google Drive:", data.files[0]);
            return true;  // File exists
        } else {
            console.log("File not found in Google Drive.");
            return false; // File not found
        }
    } else {
        console.error("Failed to check file in Google Drive:", await response.text());
        return false;  // Error during check
    }
}

// Load URLs from Google Drive
async function loadDataFromDrive(token) {
    const fileId = await getDriveFileId(token);
    if (!fileId) return [];

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Loaded data from Google Drive:", data);
        return data;
    } else {
        console.error("Failed to load file from Google Drive:", await response.text());
        return [];
    }
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    if (request.action === "authenticate") {
        authenticateUser()
            .then(sendResponse)
            .catch((err) => {
                console.error("Auth failed:", err);
                sendResponse({ success: false, error: err });
            });
    } else if (request.action === "save") {
        authenticateUser()
            .then((token) => saveDataToDrive(token, request.data))
            .then((result) => sendResponse({ success: result }))
            .catch((err) => {
                console.error("Save failed:", err);
                sendResponse({ success: false, error: err });
            });
    } else if (request.action === "load") {
        authenticateUser()
            .then((token) => loadDataFromDrive(token))
            .then((data) => sendResponse({ success: true, data }))
            .catch((err) => {
                console.error("Load failed:", err);
                sendResponse({ success: false, error: err });
            });
    }

    return true; // Required for async response
});
