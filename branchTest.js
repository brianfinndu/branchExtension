import { PageService } from './storage.js'; // Import the PageService class

function postKey() {
  let devKey = prompt("Please enter an ID.");
  let devName = prompt("Please enter your name.");
  // this is used for the demo to show we "save stuff"
  let obj = {};
  obj[devKey] = devName;
  chrome.storage.sync
      .set(obj)
      .then(() => {
        console.log("Key value pair created.");
      })
      .then(() => {
        console.log(devKey);
        chrome.storage.sync.get([devKey.toString()]).then((result) => {
          console.log("Result is " + JSON.stringify(result));
        });
      });
}
