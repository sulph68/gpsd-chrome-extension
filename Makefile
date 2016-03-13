CRX_SOURCES=crx/manifest.json crx/background.js crx/content_script.js crx/shim.js crx/icon48.png crx/icon128.png

.PHONY: clean

all: $(CRX_SOURCES) gpsd-chrome-polyfill.zip

clean:
	rm -f gpsd-chrome-polyfill.zip

gpsd-chrome-polyfill.zip: $(CRX_SOURCES)
	zip -j9 $@ $(CRX_SOURCES)


