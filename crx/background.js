/*
 * background.js
 * Background worker component for gpsd-chrome-polyfill
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


let gpsdPort = null;
let connected = false;
let debug = false;
let last_position;
const listeningTabs = new Set();

function sendPositionToTabs(position) {
  for (const tabId of listeningTabs) {
    if (debug) console.log(`Sending position to tab ${tabId}:`, position);
    chrome.tabs.sendMessage(tabId, position, (response) => {
      if (chrome.runtime.lastError) {
        if (debug) console.warn(`Could not send to tab ${tabId}:`, chrome.runtime.lastError.message);
      } else {
        if (debug) console.log(`Tab ${tabId} responded with:`, response);
      }
    });
  }
}

function handleGpsdMessage(msg) {
  connected = true;
  if (debug) console.log("gpsd message:", msg);

	const accuracy = msg.epx && msg.epy ? (msg.epx + msg.epy) / 2 : null;

	const position = {
		coords: {
			latitude: msg.lat,
			longitude: msg.lon,
			altitude: msg.alt,
			accuracy: accuracy,
			altitudeAccuracy: msg.epv,
			heading: !msg.track || msg.speed < 0.4 ? NaN : msg.track,
			speed: msg.speed
		},
		timestamp: new Date(msg.time).getTime()
	};

	if (debug) console.log("geolocation obj: " + JSON.stringify(position));
	if (msg["mode"] >= 2) {
		last_position = position;
		console.log("Current position: " + msg.lat + ", " + msg.lon);
		sendPositionToTabs(position);
	} else {
		if (last_position) {
			sendPositionToTabs(last_position);
			console.log("Last position: " + last_position.coords.latitude + ", " + last_position.coords.longitude);
		} else {
			sendPositionToTabs(position);
			console.log("Inital position: " + msg.lat + ", " + msg.lon);
		}
	}
		
}

function connectGpsd(firstTry = false) {
  connected = false;
  if (!firstTry) {
    console.log("gpsd: disconnected, retrying in 15s...");
  } else {
    if (debug) console.log("gpsd: connecting to pipe");
	}

  setTimeout(() => {
    gpsdPort = chrome.runtime.connectNative("sg.id.copper.gpspipe");
    gpsdPort.onDisconnect.addListener(() => connectGpsd(false));
    gpsdPort.onMessage.addListener(handleGpsdMessage);
  }, firstTry ? 0 : 15000);
}

function removeTabById(tabId) {
  listeningTabs.delete(tabId);
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "startGPS" && sender.tab?.id != null) {
		if (debug) console.log("Registering tab ID:", sender.tab.id);
    listeningTabs.add(sender.tab.id);

    // Use chrome.scripting.executeScript in MV3
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ["content_script.js"]
    }).then(() => {
			if (debug) console.log("content_script.js injected");
      sendResponse({ ok: true });
    }).catch((error) => {
      console.error("Failed to inject content_script.js:", error);
      sendResponse({ ok: false, error: error.message });
    });

    // Indicate async response will be sent
    return true;
  } else {
    sendResponse({ ok: true });
  }
});

// Tab cleanup listeners
chrome.tabs.onRemoved.addListener(removeTabById);
chrome.tabs.onReplaced.addListener((_, removedTabId) => removeTabById(removedTabId));

// Connect to native messaging host on service worker start
// MV3 service workers can use onStartup or onInstalled
chrome.runtime.onStartup.addListener(() => connectGpsd(true));
chrome.runtime.onInstalled.addListener(() => connectGpsd(true));

// Also connect immediately in case the service worker starts for other reasons
connectGpsd(true);

