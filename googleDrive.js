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

// Google Drive API Interaction
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
// if need can wipe the folder currently the way we 'update' files not ideal
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


