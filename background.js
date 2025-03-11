// this should dynamically get the id for the extenstion fixing the issue
// of it not syncing due to us loading unpacked
async function authenticateUser() {
    return new Promise((resolve, reject) => {
        let redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

        let authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            // ADD CLIENT ID WHEN SET UP
            `client_id=532808127148-i1vm5tplqemsog8guuf0fkmgfdjck3co.apps.googleusercontent.com&` +
            `response_type=token&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.file")}`;

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            let accessToken = new URL(redirectUrl).hash.match(/access_token=([^&]*)/)[1];
            resolve(accessToken);
        });
    });
}
// the way to load the tree from the drive NEEDS MODIFICATION TO HANDLE MUTIPLE TREES I THINK
async function loadTreeFromDrive() {
    try {
        let accessToken = await authenticateUser();

        let response = await fetch("https://www.googleapis.com/drive/v3/files?q=name='branch_tree.json'&spaces=drive", {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        let data = await response.json();
        if (data.files.length === 0) {
            console.log("No tree file found.");
            return null;
        }

        let fileId = data.files[0].id;
        let fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        let treeData = await fileResponse.json();
        console.log("Loaded tree:", treeData);
        return treeData;
    } catch (error) {
        console.error("Error loading tree from Drive:", error);
        return null;
    }
}

