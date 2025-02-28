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

class PageService {
    /**
     * Retrieves the list of saved pages from local storage.
     * @returns {Promise<Array>} An array of saved pages (objects with title and url).
     */
    static getPages() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([PAGES_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    const pages = result[PAGES_KEY] || []; // Default to an empty array if no pages exist
                    resolve(pages);
                }
            });
        });
    }

    /**
     * Saves a new page to local storage.
     * @param {string} title - The title of the page.
     * @param {string} url - The URL of the page.
     * @returns {Promise<Array>} The updated array of saved pages.
     */
    static async savePage(title, url) {
        try {
            const pages = await this.getPages(); // Get existing pages
            const updatedPages = [...pages, { title, url }]; // Add the new page

            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ [PAGES_KEY]: updatedPages }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(updatedPages);
                    }
                });
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Clears all saved pages from local storage.
     * @returns {Promise<void>}
     */
    static clearPages() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([PAGES_KEY], () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}

// Attach the class to the window object for global access in Chrome Extensions
window.PageService = PageService;
