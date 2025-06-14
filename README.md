# Improved and updated version of gpsd-chrome-polyfill
### original code and inspiration from
This project is forked from
https://github.com/micolous/gpsd-chrome-polyfill

The original readme file is available [here](legacy/README.md).
All original code is also available in the [legacy](legacy/) folder.

Compared to the original, it has been updated to match v3 of the chrome extensions messaging protocol.
The gpspipew.py script has also been slightly improved to work better in python3.

Installation instructions remains similar.

 gpsd-chrome-extension
A Google Chrome/Chromium extension providing a HTML5 Geolocation API polyfill which connects to gpsd.

This uses the [Chrome Native Messaging API](https://developer.chrome.com/extensions/nativeMessaging) in order to connect `gpspipe` to Chrome.  This doesn't use libgps as [it consistently breaks ABI compatibility](https://bugs.chromium.org/p/chromium/issues/detail?id=99177).

This consists of two parts:

1. A Python wrapper script (gpspipew) which wraps gpspipe's newline seperated message format into using the [Chrome Native Messaging protocol](https://developer.chrome.com/extensions/nativeMessaging#native-messaging-host-protocol).

2. [A Chrome extension which provides a Geolocation API polyfill.](https://chrome.google.com/webstore/detail/gpsd-chrome-polyfill/dmfdcjlppdohhegplckcbohgbbfcdfjd)

The Chrome extension is configured to use the `activeTab` permission model in lieu of implementing all of the permission handling for the Geolocation API, and then trying to get access to all websites.

As a result, it'll only work on web pages which call `navigator.geolocation.*` **after** you have activated the extension.  If the page prompts you for location access immediately on load, it will **not work** with this extension.

This is tested on Linux x86_64, but should also work on other architectures and systems which support gpsd and Chrom{e,ium}.

## Usage instructions

1. Install and configure gpsd, and ensure it is getting position information correctly.
2. Install gpspipew (see below).
3. If Chrom{e,ium} is currently running, restart it.
4. Install the Chrome extension.
5. Click the icon (satellite icon) on the page you want to share location with.
6. Press the "current location", "show my location", etc. button on the page
7. The page should show your current location.

Using [OpenStreetMap](https://openstreetmap.org) is a good test.

### Troubleshooting

If location is not showing, check the background page console log.

*If it says "Disconnected, trying to reconnect"*, then you need to:

* Check that gpspipew is installed properly, it probably doesn't have the native messaging manifest.
* Restart Chrome.
* Try running `gpspipe -w` and see if you get GPS data.

*No lat/long messages show in the console*

* Check gpsd configuration and make sure you get a location with other programs using gpsd.
* Make sure your GPS has a clear view of the sky in order to ensure it gets a fix.
* Sometimes power cycling your GPS and restarting gpsd helps.

*Have GPS messages, but the page doesn't show a location*

* Make sure it uses the HTML5 Geolocation API
* You should only activate location services after clicking the "Share GPS location with page" button
* Navigating to other pages in the tab will remove the script, so you will need to click it again for each page
* If the page activates location services on page load, *this extension will not work with it*.

*How do I limit access to location to particular pages?*

Location is shared temporarily with a page.  It will bypass the Chrome Location Services limits as a result.

## Installing `gpspipew` (the Python wrapper script)

**Note:** If this component isn't installed, the Chrome extension **will not work**.  This also requires `gpspipe`, which is in the `gpsd-clients` package.

To install the Python code, run the following:

```
sudo make install
```

This will install the script and the needed Native Messaging configuration for Chrome and Chromium.  The gory bits of that are in `gpspipew/install.sh`.  It should work on Linux and OS X.

You will need to restart Chrome after doing this.

You can test the script works with `/usr/local/bin/gpspipew.py` and it should start spitting out some binary and JSON at your terminal.

## Chrome extension

Please do a developer install for now.
See the "Hacking" section below.

### Hacking

You can point Chrome an the unpacked extension directory if you're just hacking around on the code.

If you're playing with this yourself, you'll notice that the extension ID has changed. Please update that.
Until i manage to find time to actually publish the extension, that will have to do.

If you want to test something without gpsd attached, you can enter the background page console (in chrome://extensions) and should observe some output. Do make use of `xgps` or `cgps` to ensure that your `gpsd` is working well.

## Licenses

Application code licensed under [the Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

The application icon (`icon\d+.png`, `icon.svg`) is [CC-BY Edward Boatman @ The Noun Project](https://thenounproject.com/search/?similar=625&i=625).


