/*
 * background.js
 * Background worker component for gpsd-chrome-polyfill
 * Copyright 2016 Michael Farrell <micolous+git@gmail.com>
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

var gpsd_port = null;
var connected = false;
var listening_tabs = [];

gpsd_port_messageHandler = function(msg) {
	connected = true;
	console.log('gpsd: ' + JSON.stringify(msg));

	if (msg['class'] == 'TPV' && msg['tag'] == 'RMC') {
		if (msg['mode'] >= 2) {
			// We have a fix.
			var accuracy = null;
			if (msg['epx'] && msg['epy']) {
				// Accuracy information is available, but the API doesn't
				// discriminate between lat and lon error.
				accuracy = (msg['epx'] + msg['epy']) / 2;
			}

			position = {
				coords: {
					latitude: msg['lat'],
					longitude: msg['lon'],
					altitude: msg['alt'],
					accuracy: accuracy,
					altitudeAccuracy: msg['epv'],
					heading: (!msg['track'] || msg['speed'] < 0.4) ? NaN : msg['track'],
					speed: msg['speed']
				},
				timestamp: (new Date(msg['time']))
			};

			listening_tabs.forEach(function(tab) {
				chrome.tabs.sendMessage(tab.id, position);
			});
		}
	}
};

gpsd_port_disconnectHandler = function(first_try) {
	connected = false;
	var timeout = 0;
	if (first_try !== true) {
		console.log('gpsd: disconnected, trying to reconnect in 1s...');
		timeout = 1000;
	}

	setTimeout(function() {
		gpsd_port = chrome.runtime.connectNative('au.id.micolous.gpspipe');
		gpsd_port.onDisconnect.addListener(gpsd_port_disconnectHandler);
		gpsd_port.onMessage.addListener(gpsd_port_messageHandler);
	}, timeout);
};

function removeTabById(tabId) {
	listening_tabs.forEach(function(tab, index) {
		if (tab.id == tabId) {
			listening_tabs.splice(index, 1);
			return;
		}
	});
}

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript({
		file: "content_script.js",
		runAt: "document_start"
	});

	listening_tabs.push(tab);
});

chrome.tabs.onRemoved.addListener(function(tabId, _) {
	removeTabById(tabId);
});

chrome.tabs.onReplaced.addListener(function(_, removedTabId) {
	removeTabById(removedTabId);
});

gpsd_port_disconnectHandler(true);

