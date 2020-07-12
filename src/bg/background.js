// cors request slave for content scripts
// all needs to be done because of this https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
browser.runtime.onMessage.addListener( async (request, sender, sendResponse) => {

    // request.moodlePath is path after moode url
    // request.moodlePath something like => /mod/url/view.php?id=1286837
    if (request.action == "corsMoodleRequest" && request.moodlePath) {
        const requestUrl = 'https://wuecampus2.uni-wuerzburg.de/moodle' + request.moodlePath;

        try {
            // TODO does not work for case like IG new zoom link mittwoch where
            // Wuecampus request already cors then 303 to Zoom
            // can't get real url in this case 
            let response = await fetch(requestUrl); //, { redirect: "error" }

            if (response) {
                if (!response.url.includes('https://wuecampus2.uni-wuerzburg.de/')) {
                    return response.url;
                }

                let text = await response.text();
                if (!response.url.includes('https://wuecampus2.uni-wuerzburg.de/') || !text) {
                    return response.url;
                }
                return text;
            }
        } catch (e) {
            console.warn(e);
            // console.warn(response.header)
            // return response.header.get('location');
            return response.url;
        }
    }
    return null;
});