// googleDrive.js - Adds Google Drive synchronization for saving and loading tree data
// This file handles authentication, file lookup, and folder operations using the Google Drive API in a Chrome extension.


import { Tree } from "./Tree.js";
import { TreeNode } from "./TreeNode.js";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Branch Extension with Drive Sync installed.");
});

/**
 * Authenticate the user with Google using Chrome Identity API.
 * Returns a Promise that resolves with the OAuth token.
 */
export async function authenticateUser() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                // checkers to make sure token exists
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
// the id of the folder used THIS WILL NEED TO BE CHANGED WHEN LAUNCED BACK TO APPDATA FOLDER
const folderId = "1f4308cY_lsJoStjR3tFhVa2TyT-txshT";
// CURRENTLY SAVES IT UNDER THIS NAME UPDATE TO DYNAMICALLY NAME WITH TREE NAME
const fileName = "saved_trees.json";
/**
 * Retrieve the file ID for the existing saved_trees.json in the specified folder.
 * @param {string} token - OAuth access token from authenticateUser().
 * @returns {Promise<string|null>} - The file ID if found, otherwise null.
 */
async function getDriveFileId(token) {
    // Searches the folder for the file name
    const url = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.files?.[0]?.id || null;
}
// if need can wipe the folder currently the way we 'update' files not ideal
// this will work but update it to delete only the relavent tree file and update it
async function clearDriveFolder(token) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    const deletePromises = data.files.map(file =>
        // maps each file to a DELETE request
        fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    await Promise.all(deletePromises);
    console.log("Drive folder cleared.");
}


