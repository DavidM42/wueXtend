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

## TODO
* Define one naming scheme for all files and rename them
* ESLint on and fix all the problems
* Rip whole semester / rip all wuecampus belegt button?
* Popup on archive button press
  * Shows note that only for private use don't share
  * That takes a few minutes
  * Have 2 buttons one with video (smaller) and one without videos
  * Spinning ststus feedback not statis
* Wuestudy allow password manager login like for wuecampus
* Finally write wuel.de as quick link index site for uni websites with wuestudy, wuecampus, gitlab, webmail, mcm site, rocketchat, studieverlaufsplan ask Friends if other needed
* Option to activate adspace on right side of courses somehow
* Support creator donate link please consider donatig if made your study better
* Improve AutoDateScroll with section title dates and dates parsed from fließtext
* Competive advantage bei Abstimmungen. Vor Auswahl Beginn machen. Wird gespeichert dann bei Startzeit ausgewählt auch sekundär und drei Option wählen wenn das failed dann alert