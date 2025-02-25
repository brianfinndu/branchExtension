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
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            const url = currentTab.url;
            const title = currentTab.title;

            dialogBox.textContent = `Current Tab URL: ${url}`;
            console.log(`Current Tab URL: ${url}, Title: ${title}`);

            // Save URL Button Click
            saveButton.addEventListener("click", () => {
                chrome.storage.local.get(["savedPages"], (data) => {
                    let savedPages = data.savedPages || [];
                    savedPages.push({ title, url });

                    chrome.storage.local.set({ savedPages }, () => {
                        console.log(`URL saved: ${url}`);
                        alert(`URL saved! Total saved URLs: ${savedPages.length}`);
                    });
                });
            });

            // View Saved URLs Button Click
            viewSavedButton.addEventListener("click", () => {
                chrome.storage.local.get(["savedPages"], (data) => {
                    const savedPages = data.savedPages || [];

                    dialogBox.innerHTML = "<h3>Saved URLs:</h3>";
                    savedPages.forEach((page, index) => {
                        const pageElement = document.createElement("p");
                        pageElement.textContent = `${index + 1}. ${page.title} - ${page.url}`;
                        dialogBox.appendChild(pageElement);
                    });
                });
            });
        } else {
            dialogBox.textContent = "No active tab found.";
        }
    });
});
