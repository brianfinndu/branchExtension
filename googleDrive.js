// googleDrive.js - Adds Google Drive synchronization for saving and loading tree data
// This file handles authentication, file lookup, and folder operations using the Google Drive API in a Chrome extension.
// googleDrive.js — Google Drive sync for multiple trees

/**
 * Authenticate the user with Google via Chrome Identity.
 * @returns {Promise<string>} OAuth token
 */
export async function authenticateUser() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, token => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError?.message || 'Failed to get auth token');
            } else {
                resolve(token);
            }
        });
    });
}

// Folder where all tree files live:
const folderId = '1f4308cY_lsJoStjR3tFhVa2TyT-txshT';

/**
 * Build a safe filename for a given tree.
 */
function getFileNameForTree(treeName, treeId) {
    const safe = treeName
        .replace(/[\\/:"*?<>|]+/g, '')
        .trim()
        .substring(0, 50)
        .replace(/\s+/g, '_');
    return `${safe || 'tree'}_${treeId}.json`;
}

/**
 * Find a file with this name in our Drive folder.
 * @returns {Promise<string|null>} fileId or null if not found
 */
async function getDriveFileId(token, fileName) {
    const q = `name='${fileName.replace("'", "\\'")}' and '${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json();
    return data.files?.[0]?.id || null;
}

/**
 * Save (create or update) a single tree JSON to Drive.
 * @param {string} treeName
 * @param {number} treeId
 * @param {object} treeData — a plain-POJO representation of your tree
 */
export async function saveTreeToDrive(treeName, treeId, treeData) {
    const token = await authenticateUser();
    const fileName = getFileNameForTree(treeName, treeId);
    const content = JSON.stringify(treeData, null, 2);

    // see if it already exists
    const existingId = await getDriveFileId(token, fileName);

    if (existingId) {
        // update via media upload (PATCH)
        const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`;
        await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: content
        });
        console.log(`Drive: updated tree ${treeId} → ${fileName}`);
    } else {
        // create new multipart file
        const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const metadata = { name: fileName, parents: [folderId] };
        const boundary = 'boundary_string';
        const multipartBody =
            `--${boundary}\r\n` +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) + '\r\n' +
            `--${boundary}\r\n` +
            'Content-Type: application/json\r\n\r\n' +
            content + '\r\n' +
            `--${boundary}--`;

        await fetch(createUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });
        console.log(`Drive: created tree ${treeId} → ${fileName}`);
    }
}