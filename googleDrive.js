import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Branch Extension with Drive Sync installed.");
});

// Authenticate user with Google
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

// === Google Drive API Interaction === //
const folderId = "1f4308cY_lsJoStjR3tFhVa2TyT-txshT";
const fileName = "saved_trees.json";

async function getDriveFileId(token) {
    const url = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.files?.[0]?.id || null;
}

async function clearDriveFolder(token) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    const deletePromises = data.files.map(file =>
        fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    await Promise.all(deletePromises);
    console.log("Drive folder cleared.");
}

// Save all trees to Google Drive
export async function saveTreesToDrive(token, trees) {
    await clearDriveFolder(token);

    const metadata = {
        name: fileName,
        mimeType: "application/json",
        parents: [folderId]
    };

    const fileContent = new Blob([JSON.stringify({ trees }, null, 2)], { type: "application/json" });
    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", fileContent);

    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    if (response.ok) {
        console.log("Trees saved to Drive.");
        return true;
    } else {
        console.error("Error saving trees:", await response.text());
        return false;
    }
}

// Load all trees from Google Drive
export async function loadTreesFromDrive(token) {
    const fileId = await getDriveFileId(token);
    if (!fileId) return {};

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        console.error("Failed to load trees:", await response.text());
        return {};
    }

    const data = await response.json();
    console.log("Loaded trees:", data);
    return data.trees || {};
}

// Listener to handle save/load requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveTrees") {
        authenticateUser()
            .then(token => saveTreesToDrive(token, request.trees))
            .then(success => sendResponse({ success }))
            .catch(err => sendResponse({ success: false, error: err }));
        return true;
    }

    if (request.action === "loadTrees") {
        authenticateUser()
            .then(loadTreesFromDrive)
            .then(treeMap => sendResponse({ success: true, treeMap }))
            .catch(err => sendResponse({ success: false, error: err }));
        return true;
    }
});
