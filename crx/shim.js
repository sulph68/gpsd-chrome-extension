/*
 * shim.js
 * Replaces the HTML5 Geolocation API with a version which listens to messages
 * from the content_script.
 *
 * Structure adapted from:
 * https://dl.dropboxusercontent.com/u/577031/mocklocation/mocklocation.js
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


(() => {
  "use strict";
	let debug = false;

  class LocationShim {
    constructor() {
      this.sequence = 0;
      this.watches = {};

      window.addEventListener("message", (event) => {
        if (event.source !== window && event.origin !== window.origin) {
          if (debug) console.warn("shim: message not from window");
          return;
				}

        this._notify(event.data);
      });
    }

    _notify(data) {
			if (debug) console.log("shim: notifying with data:", JSON.stringify(data,null,2));
      Object.entries(this.watches).forEach(([id, watch]) => {
        if (!watch.enabled) return;

        if (typeof watch.success === "function") {
          watch.success.call(window, data);
        }

        if (watch.once) {
          watch.enabled = false;
        }
      });
    }

    addWatch(once, success, error, options) {
      this.sequence++;
      this.watches[this.sequence] = {
        once,
        enabled: true,
        success,
        error
      };
      return this.sequence;
    }

    clearWatch(id) {
      if (this.watches[id]) {
        this.watches[id].enabled = false;
      }
    }

    destroy() {
      this.watches = {};
      return this;
    }

    static override(geolocation) {
      const shim = new LocationShim();

      geolocation.getCurrentPosition = (success, error, options) => {
        shim.addWatch(true, success, error, options);
      };

      geolocation.watchPosition = (success, error, options) => {
        return shim.addWatch(false, success, error, options);
      };

      geolocation.clearWatch = (id) => {
        shim.clearWatch(id);
      };
    }
  }

  LocationShim.override(navigator.geolocation);
  console.log("LocationShim installed (Version 3)");

  // Optional: Show a temporary toast confirming injection (wait for DOM ready)
  const showToast = () => {
    // if already shown, don't show again for session
    if (sessionStorage.getItem("gpsdToastShown")) return;

    const toast = document.createElement("div");
    toast.textContent = "GPSd connector installed.";
    Object.assign(toast.style, {
      position: "fixed",
      top: "10px",
      left: "10px",
      // right: "0",
      // textAlign: "center",
      zIndex: "99999",
      backgroundColor: "#ffb",
      color: "#333",
      fontWeight: "bold",
      fontFamily: "sans-serif",
      fontSize: "14px",
      padding: "10px",
      /* design updates */
      borderRadius: "8px",
      boxShadow: " 0 2px 6px rgba(0,0,0,0.2)",
      maxWidth: "300px",
      textAlign: "left",
      opacity: "1",
      transition: "opacity 0.6s ease",

    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 600);
    }, 4400);

    // Store session shown state
    sessionStorage.setItem("gpsdToastShown", "1");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showToast);
  } else {
    showToast();
  }

	// Page context
	window.postMessage(
  {
    source: "shim", // your own namespace
    type: "startGPS", // custom action
    payload: {}
  },
  "*"
);

})();

