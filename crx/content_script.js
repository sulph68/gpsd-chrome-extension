/*
 * content_script.js
 * Inserts the location shim into the page, and plumbs location messages from
 * the background worker into the shim.
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

