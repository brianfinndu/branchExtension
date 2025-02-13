document.addEventListener("DOMContentLoaded", () => {
    console.log("Branch extension loaded.");

    const dialogBox = document.getElementById("dialog-box");

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save URL";
    document.body.appendChild(saveButton);

    const viewSavedButton = document.createElement("button");
    viewSavedButton.textContent = "View Saved URLs";
    document.body.appendChild(viewSavedButton);

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            const url = currentTab.url;
            const title = currentTab.title;

            dialogBox.textContent = `Current Tab URL: ${url}`;
            console.log(`Current Tab URL: ${url}, Title: ${title}`);

            // Save the URL when the button is clicked
            saveButton.addEventListener("click", async () => {
                chrome.storage.sync.get(["savedPages"], (data) => {
                    let savedPages = data.savedPages || [];
                    savedPages.push({ title, url });

                    chrome.storage.sync.set({ savedPages }, () => {
                        alert(`URL saved successfully! Total saved URLs: ${savedPages.length}`);
                    });
                });
            });

            // Display saved URLs when the button is clicked
            viewSavedButton.addEventListener("click", async () => {
                chrome.storage.sync.get(["savedPages"], (data) => {
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
