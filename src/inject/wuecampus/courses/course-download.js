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

const linkedActivities = (doc) => {
    let files = [];
    const activityInstances = doc.getElementsByClassName('activityinstance');

    for (let i = 0; i < activityInstances.length; i++) {
        const element = activityInstances[i];

        // try to find name of section for sub folder in zip
        let sectionName = null;
        // TODO this method to get to correct parent is shit and could change -> find better way
        const sectionNames = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('sectionname');
        if (sectionNames.length >= 1) {
            sectionName = sectionNames[0].innerText;
        }

        // TODO not found catch?
        const linKaTag = element.getElementsByTagName('a')[0];

        let link = linKaTag.href;
        if (link.includes('resource/view.php?')) {
            // workaround cause stupid onclick event and redirect for some resources
            link += '&redirect=1';
        }

        // TODO not found catch?
        const nameV = linKaTag.getElementsByTagName('span')[0].innerText;

        // TODO catch and switch for fileType somewhere seperate
        const imageSrc = linKaTag.getElementsByTagName('img')[0].src;
        const imageSrcSplit = imageSrc.split('/');

        // strange behaviour but whatever worked around
        let typeV = imageSrcSplit[imageSrcSplit.length - 1];
        if (typeV === 'icon') {
            typeV = imageSrcSplit[imageSrcSplit.length - 3];
        }

        // TODO would like to type return type of this method with ts
        // constructing object with relevant info
        const file = {
            url: link,
            name: nameV,
            imgSrc: imageSrc,
            type: typeV,
            section: sectionName
        };
        files.push(file);
    }

    // console.log(files);
    return files;
};

const linkedSections = () => {
    let sectionLinks = [];
    const sectionInstances = document.getElementsByClassName('section-go-link');

    for (let i = 0; i < sectionInstances.length; i++) {
        const element = sectionInstances[i];

        // // try to find name of section for sub folder in zip
        // let sectionName = null;
        // // TODO this method to get to correct parent is shit and could change -> find better way
        // const sectionNames = element.parentElement.parentElement.parentElement.getElementsByClassName('sectionname');
        // if (sectionNames.length >= 1) {
        //     sectionName = sectionNames[0].innerText
        // }
        sectionLinks.push(element.href);
    }

    // console.log(sectionLinks);
    return sectionLinks;
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

// async is important else fails silently
// TODO make faster by using https://stackoverflow.com/a/37576787 promise all and parsing, adding in paralel
const externalPageSection = async (url) => {
    let html = (await (await fetch(url)).text()); 
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    return doc;
};


const archiveCourse = async () => {
    // signal user that is running
    buttonInProgress(true);

    // eslint-disable-next-line no-undef
    let zip = new JSZip();

    let otherLinks = 'name;section;url';
    let casetrains = 'name;section;url';
    let wuecasts = 'name;section;url';
    const startSize = otherLinks.length;

    // const ownBaseActivities = linkedActivities(document);
    // let activities = ownBaseActivities;
    // TODO revert test here
    let activities = [];

    // TODO section links are not recognized as activity so get them seperately, use fetch method above to get and extract links to also download their files
    const linkedSectionLinks = linkedSections();
    // console.log(linkedSectionLinks);

    for (let url of linkedSectionLinks) {
        let sectionDoc = await externalPageSection(url);
        // console.log(sectionDoc);
        let sectionActivities = linkedActivities(sectionDoc);
        // console.log(sectionActivities);
        activities = activities.concat(sectionActivities);
    }

    // console.log(activities.length);

    // filters out duplicates? TODO does this work
    activities= activities.filter((thing, index, self) => self.findIndex(t => t.url === thing.url) === index);

    console.log(activities);
    // console.log(activities.length);

    // return;

    // let activityFound = null;
    activities.forEach(activity => {

        // debuggging TODO logic

        // setting file name with section folder if it exists and was found
        let fileName = safeFileName(activity.name);
        if (activity.section && activity.section !== null) {
            fileName = safeFileName(activity.section) + '/' + fileName;
        }

        // TODO all the other file typs relevant and link sammel file for rest like casetrain
        switch (activity.type) {
        case 'pdf':
            // console.log(fileName);
            zip.file(fileName + '.pdf', urlToPromise(activity.url), { binary: true });
            break;
        case 'spreadsheet':
            // TODO derive extension from url or something not hardcoded
            zip.file(fileName + '.xls', urlToPromise(activity.url), { binary: true });
            break;
        case 'jpeg':
            zip.file(fileName + '.jpeg', urlToPromise(activity.url), { binary: true });
            break;
        case 'png':
            // never seen but possible I think
            zip.file(fileName + '.png', urlToPromise(activity.url), { binary: true });
            break;
        case 'casetrain':
            casetrains += '\n' + activity.name + ';' + activity.section + ';' + activity.url;
            break;
        case 'wuecasting':
            wuecasts += '\n' + activity.name + ';' + activity.section + ';' + activity.url;
            break;

            // TODO how to solve very big problem of folders you have to open to get files
        default:
            // fallback to add to csv list for link collection
            otherLinks += '\n' + activity.name + ';' + activity.section + ';' + activity.url;
        }

        // if (activity.type === 'pdf') {
        //     activityFound = activity;
        // }
    });

    // fallback file with rest of the things
    // for now saved as csv
    if (otherLinks.length !== startSize) {
        zip.file('other-links.csv', otherLinks , { binary: false });
    }
    if (casetrains.length !== startSize) {
        zip.file('casetrains.csv', casetrains , { binary: false });
    }
    if (wuecasts.length !== startSize) {
        zip.file('wuecasts.csv', otherLinks , { binary: false });
    }


    /* Testing creating a html element backup of course */
    
    // deep clone document clear head and body
    let doc = document.cloneNode(true);
    doc.head = document.createElement('head');
    doc.body = document.createElement('body');

    // append inline css elements from site to backup doc
    doc.querySelectorAll('style[type="text/css"').forEach((element) => {
        doc.head.appendChild(element);
    });

    // append inline script elements from site to backup doc
    doc.querySelectorAll('script:not([src]').forEach((element) => {
        doc.head.appendChild(element);
    });

    // add deep cloned paged header and content divs to html
    let pageHeader = document.querySelector('header#page-header').cloneNode(true);
    const archiveBtn = pageHeader.querySelector('#archiveDownloadBtn');
    if (archiveBtn) {
        archiveBtn.remove();
    }
    let relevantMainContentBody = document.querySelector('section#region-main').cloneNode(true);

    doc.body.appendChild(pageHeader);
    doc.body.appendChild(relevantMainContentBody);

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


    // add html to zip
    const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    zip.file(getCourseName() + '.html', htmlWithDoctype , { binary: false });

    //////////////////////////////////////////

    saveCourseZip(zip, getCourseName());
};


console.log('should add btn');

// eslint-disable-next-line no-undef
browser.runtime.sendMessage({},() => {
    var readyStateCheckInterval = setInterval(() => {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);

            addArchiveDownloadBtn();
        }
    }, 10);
});



/* vanilla js way to download something without saveAs library
TODO maybe go back to this own implementation as function in own script for less dependancies
var link = document.createElement('a');
link.href = activityFound.url;
link.download = activityFound.name;
link.dispatchEvent(new MouseEvent('click'));
*/