document.addEventListener("DOMContentLoaded", async () => {
  try {
    chrome.identity.getAuthToken({ interactive: false }, async (token) => {
      const query = `mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          query
        )}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const { files } = await res.json();
      console.log(files); // Array of { id, name, modifiedTime }

      const cardContainer = document.getElementById("card-container");
      for (const file of files) {
        let newCard = document.querySelector(".card-template").cloneNode(true);
        newCard.removeAttribute("id");
        newCard.className = "card";
        newCard.dataset.treeId = file.id;
        newCard.querySelector(".title").textContent = file.name.slice(0, -5);
        newCard.querySelector(".timestamp").textContent =
          "Last Change: " + file.modifiedTime;
        cardContainer.appendChild(newCard);
      }
    });
  } catch (error) {
    console.error(error);
  }
});
