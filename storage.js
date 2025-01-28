// Utility function to wrap callback-based Chrome APIs into Promises
const toPromise = (callback) => {
    return new Promise((resolve, reject) => {
        try {
            callback(resolve, reject);
        } catch (err) {
            reject(err);
        }
    });
};

// chrome local storage used here
const PAGES_KEY = "pages"; // Key under which pages are stored

export class PageService {
    /**
     * Retrieves the list of saved pages from local storage.
     * returns An array of saved pages (objects with title and url).
     */
    static getPages = () => {
        return toPromise((resolve, reject) => {
            chrome.storage.local.get([PAGES_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    const pages = result[PAGES_KEY] || []; // Default to an empty array if no pages exist
                    resolve(pages);
                }
            });
        });
    };

    /**
     * Saves a new page to local storage.
     * @param title - title of the page
     * @param {string} url - The URL of the page.
     * @returns {Promise<Array>} The updated array of saved pages.
     */
    static savePages = async (title, url) => {
        const pages = await this.getPages(); // Get existing pages
        const updatedPages = [...pages, { title, url }]; // Add the new page
        return toPromise((resolve, reject) => {
            chrome.storage.local.set({ [PAGES_KEY]: updatedPages }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(updatedPages);
                }
            });
        });
    };
    // WROTE FOR FUTURE USE BUT HAVENT IMPLEMENTED YET WILL BE USED TO DELETE NODES POSSIBLY
    static clearPages = () => {
        return toPromise((resolve, reject) => {
            chrome.storage.local.remove([PAGES_KEY], () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    };
}
