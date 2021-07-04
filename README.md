# wueXtension
Assisting functionality for the websites of the university of wuerzburg in a single browser extension

## Features

* Added button in nav bar of courses to easily leave courses
* Auto login function for wuecampus and wuestudy
    * Once logged in for the first time will login automatically every time
    * Login credentials changeable in addon settings
* Download archive zip version of courses

## Test locally
1. Clone `git clone git@github.com:DavidM42/wueXtension.git`
    * cd wueXtension
2. `npm install`
3. Load in browser

## Third party library sources
* Browser Polyfill [CDN](https://unpkg.com/browse/webextension-polyfill@0.6.0/dist/browser-polyfill.min.js) and [github](https://github.com/mozilla/webextension-polyfill)
* Pako [github relase](https://github.com/nodeca/pako/blob/1.0.11/dist/pako.min.js)
* Web Streams Polyfill [CDN Folder](https://www.jsdelivr.com/package/npm/web-streams-polyfill?path=dist); [CDN File](https://cdn.jsdelivr.net/npm/web-streams-polyfill@3.0.0/dist/polyfill.es6.min.js) and [github](https://github.com/MattiasBuelens/web-streams-polyfill)
* Streamsaver [github](https://github.com/jimmywarting/StreamSaver.js)
* Transcend.IO Conflux [github](https://github.com/transcend-io/conflux)
* Mime-Types [CDN](https://cdn.jsdelivr.net/npm/mime-types@2.1.27/index.js) [github](https://github.com/jshttp/mime-types)

## TODO

* Build script to combine scripts and import
* Define one naming scheme for all files and rename them
* ESLint on and fix all the problems
* Rip whole semester / rip all wuecampus belegt button?
* Popup on archive button press
  * Shows note that only for private use don't share
  * That takes a few minutes
  * Have 2 buttons one with video (smaller) and one without videos
  * Spinning ststus feedback not statis
* Wuestudy allow password manager login like for wuecampus
* Support creator donate link please consider donatig if made your study better
* Improve AutoDateScroll with section title dates and dates parsed from fließtext
* Competive advantage bei Abstimmungen. Vor Auswahl Beginn machen. Wird gespeichert dann bei Startzeit ausgewählt auch sekundär und drei Option wählen wenn das failed dann alert
* Choice groups links like https://wuecampus2.uni-wuerzburg.de/moodle/mod/choicegroup/view.php?id=962443
* Html slide decks like https://wuecampus2.uni-wuerzburg.de/moodle/mod/resource/view.php?id=1020296
