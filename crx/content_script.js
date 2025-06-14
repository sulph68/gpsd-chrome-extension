/*
 * content_script.js
 * Inserts the location shim into the page, and plumbs location messages from
 * the background worker into the shim.
 * Copyright 2016 Michael Farrell <micolous+git@gmail.com>
 * Copyright 2025 Benjamin Khoo <sulph68@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	// console.log("content_script received:", msg);
  // Forward GPS message to the window context (where shim.js is listening)
  window.postMessage(msg, window.origin);
});

// Listen for messages posted from the page
window.addEventListener("message", function (event) {
  if (event.source !== window) return; // Only accept from same window
  if (!event.data || event.data.source !== "shim") return; // Verify origin

  // Relay to background
  chrome.runtime.sendMessage(event.data.type, (response) => {
    console.log("Got response from background:", response);
  });
});

// Inject shim.js into the page's JavaScript context
const shim = document.createElement('script');
shim.src = chrome.runtime.getURL('shim.js');  // chrome.extension → chrome.runtime
shim.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(shim);

