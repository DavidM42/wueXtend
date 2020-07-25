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
                // was an idea but stopped with this
                // if (response.headers.get('Content-Type').includes('video')){
                //     return {
                //         streamUrl: response.url,
                //         stream: response.body
                //     };
                // }

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
            // maybe find some fix for it sometimes
            // e is "NetworkError when attempting to fetch resource" when this get's called with moodle url which 303 redirects to external url which disallows cors
            try {
              // response is not defined at these cors request failures so catch that and just return moodle url for now
              return response.url;              
            } catch (e) {
              if(e.name == "ReferenceError") {
                return requestUrl;
              }
            }
        }
    }
    return null;
});