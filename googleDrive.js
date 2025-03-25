chrome.runtime.onInstalled.addListener(() => {
    console.log("Branch Extension installed.");
});

// Function to authenticate user with Google
export async function authenticateUser() {
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
    const url = `https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json' and '${'1f4308cY_lsJoStjR3tFhVa2TyT-txshTFolder'}' in parents`;
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

// Delete all files in the folder
async function clearDriveFolder(token, folderId) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        console.error("Drive API error while listing files:", await response.text());
        return false;
    }

    const data = await response.json();
    const deletePromises = data.files.map(file =>
        fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
    );

    await Promise.all(deletePromises);
    console.log("All files in the folder have been deleted.");
    return true;
}

// Create or update the file in Google Drive
export async function saveDataToDrive(token, urls) {
    const folderId = "1f4308cY_lsJoStjR3tFhVa2TyT-txshT";
    console.log("Clearing folder before uploading new file...");
    await clearDriveFolder(token, folderId);

    console.log("Uploading new file...");
    const metadata = {
        name: "saved_urls.json",
        mimeType: "application/json",
        parents: [folderId]
    };

    const fileContent = new Blob([JSON.stringify(urls)], { type: "application/json" });
    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", fileContent);

    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const responseData = await response.json();
        console.log("Google Drive API Response:", responseData);

        if (response.ok) {
            console.log("File successfully saved to Google Drive.");
            return true;
        } else {
            console.error("Failed to save file to Google Drive:", responseData);
            return false;
        }
    } catch (error) {
        console.error("Error while saving to Google Drive:", error);
        return false;
    }
}


export async function checkFileExists(token) {
    const url = "https://www.googleapis.com/drive/v3/files?q=name='saved_urls.json' and '1f4308cY_lsJoStjR3tFhVa2TyT-txshT' in parents";

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Handle any errors or unsuccessful responses
    if (!response.ok) {
        console.error("Error checking file existence:", await response.text());
        return false; // Return false if there's an issue with the API call
    }

    const data = await response.json();

    // Ensure the response has a valid `files` array
    if (data.files && data.files.length > 0) {
        console.log("File exists in Google Drive.");
        return true;
    } else {
        console.log("File does not exist in Google Drive.");
        return false;
    }
}


// Load URLs from Google Drive
export async function loadDataFromDrive(token) {
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

