// TODO smarter with CSS file and html template
// TODO write own classes for style cause nav classes not correct here
const downloadBtnTemplate = `
<div class="studentdash nav-item nav-link" style="padding: 0 3px 0 2px;">
    <a role="button" title="" class="btn btn-secondary fhs-tooltip" id="archiveDownloadBtn">
        <i class="fa fa-download" style="color: #FFF;" id="archiveDownloadIcon"> Archive</i>
    </a>
</div>
`;

const addArchiveDownloadBtn = () => {
    // TODO fix only having one button never more than one
    // const existingArchiveBtn = document.getElementById('archiveDownloadBtn');
    // if (!existingArchiveBtn) {

        const dFlexes = document.getElementById('page-header').getElementsByClassName('d-flex');
        if (dFlexes.length === 3) {
            // add btn template 
            dFlexes[0].innerHTML += downloadBtnTemplate;
    
            // and onclick event to download
            const archiveBtn = document.getElementById('archiveDownloadBtn');
            archiveBtn.onclick = archiveCourse;
        }
    // }
};

const buttonInProgress = (inProgressBool) => {
    // reflect status of archive export on website via button
    const archiveBtn = document.getElementById('archiveDownloadBtn');
    const archiveIcon = document.getElementById('archiveDownloadIcon');

    if (inProgressBool === true) {
        // spinner icon and not interactable
        archiveIcon.classList.remove('fa-download');
        archiveIcon.classList.add('fa-spinner');
        archiveBtn.classList.add('notInteractable');
    } else {
        // back to normal with download icon and interaction
        archiveIcon.classList.remove('fa-spinner');
        archiveIcon.classList.add('fa-download');
        archiveBtn.classList.remove('notInteractable');
    }
};

const safeFileName = (inString) => {
    // i dont even know what the difference here is but had errors even though looks same -> probs some encoding error
    inString = inString.replace('ö', 'ö');

    // umlaut boogaloo
    // inString = inString.replace('ö', 'oe').replace('ä', 'ae').replace('ü', 'ue').replace('ß', 'ss');
    // inString = inString.replace('Ö', 'Oe').replace('Ä', 'Ae').replace('Ü', 'Ue');

    // TODO is temp simple solution thanks to https://stackoverflow.com/a/8485137 maybe safer way usable in client side js
    // including umlaut boogaloo so doesnt get -
    return inString.replace(/[^a-z0-9äöüß]/gi, '-');
};


const saveCourseZip = (zip, courseName) => {
    let todayString = new Date().toISOString().slice(0, 10);

    // Generate the zip file asynchronously
    zip.generateAsync({ 
        type: 'blob', 
        // TODO works?
        // encodeFileName: function (string) {
        //     return decodeURIComponent(string);
        // }
    })
        .then((content) => {
            // TODO maybe https://github.com/jimmywarting/StreamSaver.js
            // eslint-disable-next-line no-undef
            saveAs(content, 'archive-' + safeFileName(courseName) + '-' + todayString + '.zip');

            // allow download again
            buttonInProgress(false);
        });
};

const urlToPromise = (url) => {
    // from https://stackoverflow.com/a/49003082
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-undef
        JSZipUtils.getBinaryContent(url, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

const getCourseName = () => {
    let name = '';

    const pageHeader = document.getElementById('page-header');
    if (pageHeader !== null) {
        const h1s = pageHeader.getElementsByTagName('h1');
        if (h1s.length >= 1) {
            name = h1s[0].innerText;
        }
    }
    return name;
};


/**
 * Deep clone current document then clear head and body
 */
const getBasicCleanDocumentClone = () => {
    // 
    let doc = document.cloneNode(true);
    doc.head = document.createElement('head');
    doc.body = document.createElement('body');
    return doc;
}

/**
 * Adds page header of current course (name link cascade)
 * and page content (links to all resources) to document
 * @param {document} doc 
 */
const addRelevantHtmlToDoc = (doc) => {
    // add deep cloned paged header and content divs to html
    let pageHeader = document.querySelector('header#page-header').cloneNode(true);
    const archiveBtn = pageHeader.querySelector('#archiveDownloadBtn');
    if (archiveBtn) {
        archiveBtn.remove();
    }
    let relevantMainContentBody = document.querySelector('section#region-main').cloneNode(true);

    doc.body.appendChild(pageHeader);
    doc.body.appendChild(relevantMainContentBody);
    return doc;
}

/**
 * Adds external resources like scripts and css stylesheets the html depends on to document
 * @param {document} doc 
 * @param {any} zip 
 */
const addExternalResourcesToDoc = (doc, zip) => {
    // append inline css elements from site to backup doc
    doc.querySelectorAll('style[type="text/css"').forEach((element) => {
        doc.head.appendChild(element);
    });

    // append inline script elements from site to backup doc
    doc.querySelectorAll('script:not([src]').forEach((element) => {
        doc.head.appendChild(element);
    });

    // convert dependancies to array an combine
    let allCssLinks = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
    let allJSLinks = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
    const allExternalResources = allCssLinks.concat(allJSLinks);

    for (let i = 0; i < allExternalResources.length; i++) {
        const linkElement = allExternalResources[i].cloneNode(true);

        // add css to zip for download
        let source = linkElement.href || linkElement.src;
        let pathArray = source.split('https://wuecampus2.uni-wuerzburg.de/moodle/');
        if (pathArray.length < 2) {
            continue;
        }
        const path = 'websources/' + pathArray[1];
        zip.file(path, urlToPromise(source) , { binary: true });

        // add link to it to html
        if (linkElement.href) {
            linkElement.href = path;
        } else if(linkElement.src) {
            linkElement.src = path;
        } else {
            continue;
        }
        doc.head.appendChild(linkElement);
    }
    return doc;
}


// async is important else fails silently
// TODO make faster by using https://stackoverflow.com/a/37576787 promise all and parsing, adding in paralel
/**
 * Resolves deeper Moodle Pages via background script because of cors to resolve links in html or 303 redirects
 * @param {string} moodleUrl 
 */
const resolveDeepMoodleLinks = async (moodleUrl) => {
    const moodleUrlSchema = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/url/';
    const moodlePathSplit = moodleUrl.split('https://wuecampus2.uni-wuerzburg.de/moodle');
    if (moodlePathSplit.length < 2) {
        return;
    }

    const backgroundCorsRequest = {
        action: 'corsMoodleRequest',
        moodlePath: moodlePathSplit[1]
    };
    let textOrUrl = await browser.runtime.sendMessage(backgroundCorsRequest);
    
    if (textOrUrl && textOrUrl.includes('<html') && textOrUrl.includes('</html>')) {
        let parser = new DOMParser();
        let linkedDoc = parser.parseFromString(textOrUrl, 'text/html');
        
        // TODO have to insert here for other things than a tags like video pages and so on
        const redirectLinkDiv = linkedDoc.querySelector('div.urlworkaround');
        if (redirectLinkDiv) {
            const redirectLinkAtag = redirectLinkDiv.querySelector('a');
            if (redirectLinkAtag) {
                if (redirectLinkAtag.href.includes(moodleUrlSchema)) {
                    return await resolveDeepMoodleLinks(redirectLinkAtag.href);
                } else {
                    return redirectLinkAtag.href;
                }
            }
        }
    }

    if (textOrUrl.includes(moodleUrlSchema)) {
        return await resolveDeepMoodleLinks(redirectLinkAtag.href);
    }
    return textOrUrl;
};

/**
 * Replaces moodle links with direct links to resources
 * @param {document} doc 
 */
const replaceMoodleLinks = async (doc) => {
    const moodleUrlSchema = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/url/';
    const selector = 'a[href^="' + moodleUrlSchema + '"]';
    const linkElements = doc.querySelectorAll(selector);

    for (let i = 0; i < linkElements.length; i++) {
        const element = linkElements[i];

        element.href = element.href.replace('&redirect=1', '')
        try {
            linkElements[i].href = await resolveDeepMoodleLinks(element.href);
        } catch(e) {
            // console.error(e);
        }
    }

    // TODO other moodle links like videos not just links

    return doc;
}

const archiveCourse = async () => {
    // signal user that is running
    buttonInProgress(true);

    // eslint-disable-next-line no-undef
    let zip = new JSZip();


    /* Testing creating a html element backup of course */
    let doc = getBasicCleanDocumentClone();
    doc = addRelevantHtmlToDoc(doc);
    doc = addExternalResourcesToDoc(doc, zip);


    doc = await replaceMoodleLinks(doc);



    // add html to zip finally
    const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    zip.file(getCourseName() + '.html', htmlWithDoctype , { binary: false });

    //////////////////////////////////////////

    // TODO reactivate after testing
    saveCourseZip(zip, getCourseName());
};

safeFileName
// eslint-disable-next-line no-undef
browser.runtime.sendMessage({},() => {
    var readyStateCheckInterval = setInterval(() => {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);

            addArchiveDownloadBtn();
        }
    }, 10);
});