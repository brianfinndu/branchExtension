
// for this to work i had to go into chrome extenstions then do keyboard shortcuts and set show homepage preview to ctr +m
chrome.commands.onCommand.addListener((command) => {
    if (command === "show_preview") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || tabs[0].url.startsWith("chrome://")) {
                return;  // Do nothing if it's a chrome:// URL
            }

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: toggleBranch
            });
        });
    }
});

function toggleBranch() {
    let iframe = document.getElementById("branch-preview");

    if (iframe) {
        iframe.remove(); // Hide if already open
        return;
    }

    iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("branch.html");
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "400px";
    iframe.style.height = "300px";
    iframe.style.border = "1px solid black";
    iframe.style.background = "white";
    iframe.style.zIndex = "10000";
    iframe.id = "branch-preview";

    let closeButton = document.createElement("button");
    closeButton.innerText = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.background = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener("click", function () {
        iframe.remove();
    });

    document.body.appendChild(iframe);
}