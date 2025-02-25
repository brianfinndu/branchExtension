chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});

// Function to authenticate user with Google
async function authenticateUser() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

// Get Google Drive File ID (or create if not exists)
async function getDriveFileId(token) {
    const response = await fetch("https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json'&spaces=appDataFolder", {
        headers: { Authorization: `Bearer ${token}` }
    });
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

    return response.ok;
}

// Load URLs from Google Drive
async function loadDataFromDrive(token) {
    const fileId = await getDriveFileId(token);
    if (!fileId) return [];

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
        return await response.json();
    } else {
        return [];
    }
}

// Export functions for content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "authenticate") {
        authenticateUser().then(sendResponse);
    } else if (request.action === "save") {
        authenticateUser()
            .then(token => saveDataToDrive(token, request.data))
            .then(sendResponse);
    } else if (request.action === "load") {
        authenticateUser()
            .then(token => loadDataFromDrive(token))
            .then(sendResponse);
    }
    return true;
});
