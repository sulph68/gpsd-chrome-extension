/*
 * content_script.js
 * Inserts the location shim into the page, and plumbs location messages from
 * the background worker into the shim.
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

chrome.runtime.onMessage.addListener(function(msg) {
	// Got a message from gpsd, send it to the window
	window.postMessage(msg, '*');
});

// Add the shim
var shim = document.createElement('script');
shim.src = chrome.extension.getURL('shim.js');
shim.onload = function() {
	this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(shim);

