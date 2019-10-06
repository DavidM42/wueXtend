// TODO smarter with CSS file and html template
// TODO write own classes for style cause nav classes not correct here
const downloadBtnTemplate = `
<div class="studentdash nav-item nav-link" style="padding: 0 3px 0 2px;">
    <a role="button" title="" class="btn btn-secondary fhs-tooltip" id="archiveDownloadBtn">
        <i class="fa fa-download" style="color: #FFF;" id="archiveDownloadIcon"> Archive</i>
    </a>
</div>
`;

function addArchiveDownloadBtn() {
    const dFlexes = document.getElementById('page-header').getElementsByClassName('d-flex');
    if (dFlexes.length === 3) {
        // add btn template 
        dFlexes[0].innerHTML += downloadBtnTemplate;

        // and onclick event to download
        const archiveBtn = document.getElementById('archiveDownloadBtn');
        archiveBtn.onclick = archiveCourse;
    }
}

function buttonInProgress(inProgressBool) {
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
}

function safeFileName(inString) {
    // i dont even know what the difference here is but had errors even thou looks same -> probs some encoding error
    inString = inString.replace('ö', 'ö');

    // umlaut boogaloo
    // inString = inString.replace('ö', 'oe').replace('ä', 'ae').replace('ü', 'ue').replace('ß', 'ss');
    // inString = inString.replace('Ö', 'Oe').replace('Ä', 'Ae').replace('Ü', 'Ue');

    // TODO is temp simple solution thanks to https://stackoverflow.com/a/8485137 maybe safer way usable in client side js
    // including umlaut boogaloo so doesnt get -
    return inString.replace(/[^a-z0-9äöüß]/gi, '-');
}

function linkedActivities() {
    let files = [];
    const activityInstances = document.getElementsByClassName('activityinstance');

    for (let i = 0; i < activityInstances.length; i++) {
        const element = activityInstances[i];

        // try to find name of section for sub folder in zip
        let sectionName = null;
        // TODO this method to get to correct parent is shit and could change -> find better way
        const sectionNames = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getElementsByClassName('sectionname');
        if (sectionNames.length >= 1) {
            sectionName = sectionNames[0].innerText
        }

        // TODO not found catch?
        const linKaTag = element.getElementsByTagName('a')[0];

        let link = linKaTag.href;
        if (link.includes('resource/view.php?')) {
            // workaround cause stupid onclick event and redirect for some resources
            link += '&redirect=1'
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
        }
        files.push(file)
    }

    // console.log(files);
    return files;
}

function saveCourseZip(zip, courseName) {
    let todayString = new Date().toISOString().slice(0, 10);

    // Generate the zip file asynchronously
    zip.generateAsync({ 
        type: "blob", 
        // TODO works?
        // encodeFileName: function (string) {
        //     return decodeURIComponent(string);
        // }
        })
        .then(function (content) {
            // TODO maybe https://github.com/jimmywarting/StreamSaver.js
            saveAs(content, "archive-" + safeFileName(courseName) + '-' + todayString + ".zip");

            // allow download again
            buttonInProgress(false);
        });
}

function urlToPromise(url) {
    // from https://stackoverflow.com/a/49003082
    return new Promise(function (resolve, reject) {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function getCourseName() {
    let name = '';

    const pageHeader = document.getElementById('page-header');
    if (pageHeader !== null) {
        const h1s = pageHeader.getElementsByTagName('h1');
        if (h1s.length >= 1) {
            name = h1s[0].innerText;
        }
    }
    return name;
}


function archiveCourse() {
    // signal user that is running
    buttonInProgress(true);

    let zip = new JSZip();
    const activities = linkedActivities();

    let otherLinks = "name;section;url"
    // let activityFound = null;
    activities.forEach(activity => {
        // debuggging TODO logic

        // setting file name with section folder if it exists and was found
        let fileName = safeFileName(activity.name);
        if (activity.section && activity.section !== null) {
            fileName = safeFileName(activity.section) + '/' + fileName;
        }

        // TODO images and all the other file typs relevant and link sammel file for rest like casetrain
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
                // TODO casetrain list file
                break;
            case 'wuecasting':
                // TODO wuecasting list
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
    zip.file('other-links.csv', otherLinks , { binary: false });

    // console.log(activityFound);
    // zip.file(safeFileName(activityFound.name) + '.pdf', urlToPromise(activityFound.url), { binary: true }); //, base64: true


    // Generate a directory within the Zip file structure
    // var img = zip.folder("images");
    // Add a file to the directory, in this case an image with data URI as contents
    // img.file("smile.gif", imgData, { base64: true });

    saveCourseZip(zip, getCourseName());
}

browser.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // archiveCourse();
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