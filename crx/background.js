/*
 * background.js
 * Background worker component for gpsd-chrome-polyfill
 * Copyright 2016 Michael Farrell <micolous+git@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

