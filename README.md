# gpsd-chrome-polyfill

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

[Available from the Chrome Web Store.](https://chrome.google.com/webstore/detail/gpsd-chrome-polyfill/dmfdcjlppdohhegplckcbohgbbfcdfjd)

### Building the ZIP

This is used to upload the package to the Chrome web store.

```
make gpsd-chrome-polyfill.zip
```

### Hacking

You can point Chrome an the unpacked extension directory if you're just hacking around on the code.

If you're playing with this yourself, you'll notice that the extension ID has changed, as that is tied to my private key.

If you want to test something without gpsd attached, you can enter the background page console (in chrome://extensions) and enter the following code into the console:

```javascript
setInterval(function() { gpsd_port_messageHandler({class:'TPV',tag:'RMC', lat:-33.85717, lon:151.21502, mode:2, time:(new Date()).getTime()}); }, 1000);
```

This will send a GPS message every second with your location as the [Sydney Opera House](https://en.wikipedia.org/wiki/Sydney_Opera_House).

### Using with other extensions

I've limited gpspipew to only work with my version of the extension.  You may have to change the allowed extension IDs in order to work with your development version.

I'm happy to open this native messaging pipe to other open source Chrome extensions in my mainline version.

If you want to use the service for a non-OSS Chrome Extension, you'll need to package your own version of `gpspipew`.

## Licenses

Application code is licensed under LGPLv3+.  See `COPYING` and `COPYING.LESSER`.

The application icon (`icon\d+.png`, `icon.svg`) is [CC-BY Edward Boatman @ The Noun Project](https://thenounproject.com/search/?similar=625&i=625).

## Footnote

A better way to do this is to allow Chrome extensions to implement Location Providers.

