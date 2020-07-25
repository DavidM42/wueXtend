// TODO smarter with CSS file and html template
// TODO write own classes for style cause nav classes not correct here
// almost same code as enrollment button
const archiveNavButtonTemplate = `
<div class="studentdash nav-item nav-link" style="padding: 0 3px 0 2px;" id="archiveDownloadBtn">
    <a role="button" title="Download Course Archive" class="btn btn-secondary fhs-tooltip" href="javascript:;">
        <i id="archiveDownloadIcon" class="fa fa-download"></i>
    </a>
</div>
`;

/**
 * Simple async await wrapper to wait some random time between requests to avoid blocking
 * @param {number} timeMs Time in ms to wait for 
 * @Depcrecated Was not needed just use requests more sequentially and await last
 */
const waitHumanLikeTime = async (timeMs) => {
  // min timeMs - 125 but never less than 1
  const min = (timeMs - 125) < 1 ? 1 : (timeMs - 250);
  const max = timeMs + 125;
  const humanLikeWaitTime = Math.random() * (max - min) + min
  return new Promise((resolve) => setTimeout(() => resolve(), humanLikeWaitTime));
}

/**
 * Helper method to write into writer and also help with debugging of edge cases and breaking files
 * returns a void promise SO AWAIT IF YOU WANT TO WAIT FOR WRITE AND NOT CONCURRENT
 * see https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter/write
 * @param {any} writer The writer object to write into
 * @param {string} path The path in the zip file to save the file to
 * @param {ReadableStream<Uint8Array>} stream The stream to write into the file
 */
const writeStreamIntoZip = (writer, path, stream) => {
  console.log('%c Will now stream into: ' + path, 'font-size: 8px; color: #33;');
  return writer.write({
    name: path,
    lastModified: new Date(),
    stream: () => stream
  });
}


// TODO two buttons one button with videos one without
const addArchiveDownloadBtn = () => {
  const existingArchiveBtn = document.getElementById('archiveDownloadBtn');
  if (existingArchiveBtn) {
    existingArchiveBtn.remove();
  }

  const courseControls = document.getElementsByClassName('coursecontrols');
  if (courseControls.length === 1) {
    courseControls[0].innerHTML += archiveNavButtonTemplate;

    // and assign onclick archive to btn
    const newArchiveBtn = document.getElementById('archiveDownloadBtn');
    newArchiveBtn.onclick = archiveCourse;
  }

  const dFlexes = document.getElementById('page-header').getElementsByClassName('d-flex');
  if (dFlexes.length === 3) {
    // add btn template 
    dFlexes[0].innerHTML += downloadBtnTemplate;

    // and onclick event to download
    const archiveBtn = document.getElementById('archiveDownloadBtn');
  }
};

const buttonInProgress = (inProgressBool) => {
  // reflect status of archive export on website via button
  const archiveBtn = document.getElementById('archiveDownloadBtn');
  const archiveIcon = document.getElementById('archiveDownloadIcon');

  if (inProgressBool === true) {
    // spinner icon and not interactable
    archiveIcon.classList.remove('fa-download');
    archiveIcon.classList.add('fa-spinner')
    archiveIcon.classList.add('fa-spin');
    archiveBtn.classList.add('notInteractable');
  } else {
    // back to normal with download icon and interaction
    archiveIcon.classList.remove('fa-spinner')
    archiveIcon.classList.remove('fa-spin');
    archiveIcon.classList.add('fa-download');
    archiveBtn.classList.remove('notInteractable');
  }
};

const safeFileName = (inString) => {
  // i dont even know what the difference here is but had errors even though looks same -> probs some encoding error
  inString = inString.replace(/ö/g, 'ö');

  // umlaut boogaloo
  // inString = inString.replace('ö', 'oe').replace('ä', 'ae').replace('ü', 'ue').replace('ß', 'ss');
  // inString = inString.replace('Ö', 'Oe').replace('Ä', 'Ae').replace('Ü', 'Ue');

  // TODO is temp simple solution thanks to https://stackoverflow.com/a/8485137 maybe safer way usable in client side js
  // including umlaut boogaloo so doesnt get -
  // For - surrounded by e.g. spaces it replaces "dwdwd - dwdw " with "dwdwd---dwdw" and then "dwdwd-dwdw"
  return inString.replace(/[^a-z0-9äöüß()+]/gi, '-').replace(/ /g, '_').replace(/---/g, '-');
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
 * @param {*} inputDoc The input doc which to copy
 */
const getBasicCleanDocumentClone = (inputDoc) => {
  let doc = inputDoc.cloneNode(true);
  doc.head = inputDoc.createElement('head');
  doc.body = inputDoc.createElement('body');
  return doc;
}

/**
 * Adds page header of current course (name link cascade)
 * and page content (links to all resources) to document
 * @param {document} inputDoc The doc which copy from
 * @param {document} resultDoc The doc which should contain important info from currentDoc
 */
const addRelevantHtmlToDoc = (inputDoc, resultDoc) => {
  // add deep cloned paged header and content divs to html
  let pageHeader = inputDoc.querySelector('header#page-header').cloneNode(true);
  const archiveBtn = pageHeader.querySelector('#archiveDownloadBtn');
  if (archiveBtn) {
    archiveBtn.remove();
  }
  let relevantMainContentBody = inputDoc.querySelector('section#region-main').cloneNode(true);

  // TODO find every image[src] so every image with a source -> download image and relink to local

  resultDoc.body.appendChild(pageHeader);
  resultDoc.body.appendChild(relevantMainContentBody);
  return resultDoc;
}

/**
 * Adds external resources like scripts and css stylesheets the html depends on to document
 * @param {any} writer Zip writer to write into 
 * @param {document} inputDoc Input document to get stylesheets and scripts from
 * @param {document} doc Document object to edit
 */
// TODO fix this method and all the strange cases from wuecampus
const addExternalResourcesToDoc = async (writer, inputDoc, doc) => {
  // append inline css elements from site to backup doc
  doc.querySelectorAll('style[type="text/css"').forEach((element) => {
    doc.head.appendChild(element);
  });

  // append inline script elements from site to backup doc
  doc.querySelectorAll('script:not([src]').forEach((element) => {
    doc.head.appendChild(element);
  });

  // convert dependancies to array an combine
  let allCssLinks = Array.prototype.slice.call(inputDoc.querySelectorAll('link[rel="stylesheet"]'));
  let allJSLinks = Array.prototype.slice.call(inputDoc.querySelectorAll('script[src]'));
  const allExternalResources = allCssLinks.concat(allJSLinks);

  const alreadyDownloadedExternalSources = [];
  const alreadyExistingPaths = [];
  for (let i = 0; i < allExternalResources.length; i++) {
    const linkElement = allExternalResources[i].cloneNode(true);

    // add css to zip for download
    let source = linkElement.href || linkElement.src;
    let pathArray = source.split('https://wuecampus2.uni-wuerzburg.de/moodle/');
    if (pathArray.length < 2) {
      continue;
    }

    // TODO not safe filename here okay? probably if url safe also file name safe?

    let path = 'websources/' + decodeURIComponent(pathArray[1]);
  
    if (!alreadyDownloadedExternalSources.includes(source)) {
      // download and links js/css
      const resourceResponse = await fetch(source);
      const resourceStream = resourceResponse.body;

      if (resourceResponse.ok) {
        const fileNameSplit = resourceResponse.url.split('/');
        const urlFileName = fileNameSplit[fileNameSplit.length - 1];
        
        const fileEndingSplit = urlFileName.split('.');
        let fileEnding;
        if (fileEndingSplit.length > 1) {
          // read file ending from url
          fileEnding = fileEndingSplit[1];
            
          // make sure to not include query like ?forcedownload
          const splitQueryEnding = fileEnding.split('?');
          fileEnding = splitQueryEnding[0];
        } else {
          // guess file Ending from element type
          if (linkElement.tagName === 'SCRIPT') {
            fileEnding = 'js';
          } else if (linkElement.tagName === 'LINK') {
            fileEnding = 'css';
          } else {
            // unknown file ending so can't save and skip this element
            continue;
          }
        }

        // check agains array of names already used to not create duplicates
        let fileName = decodeURIComponent(urlFileName.split('.')[0]);
    
        // safe filename is important else it crashes
        let path = 'websources/' + fileName + '.' + fileEnding;
    
        if (alreadyExistingPaths.includes(path)) {
          alreadyExistingPaths.push(path);
          alreadyDownloadedExternalSources.push(source);

          // TODO warn if not okay instead of ignoring
          writeStreamIntoZip(writer, path, resourceStream);
        }

        // add link to it to html
        if (linkElement.href) {
          linkElement.href = path;
        } else if (linkElement.src) {
          linkElement.src = path;
        } else {
          continue;
        }
        doc.head.appendChild(linkElement);
      }
    } else {
      // only relink not re download css and js files
      if (linkElement.href) {
        linkElement.href = alreadyExistingPaths[alreadyDownloadedExternalSources.indexOf(source)];
      } else if (linkElement.src) {
        linkElement.src = alreadyExistingPaths[alreadyDownloadedExternalSources.indexOf(source)];
      } else {
        continue;
      }
      doc.head.appendChild(linkElement);
    }

    // await waitHumanLikeTime(150);
  }
  return doc;
}

/**
 * Changes link in nav bar at top to index html from backup
 * @param {*} doc 
 * @param {boolean} alreadyOn If this page of doc is already main page so only link #
 */
const addLinkBackToCourseToNav = (doc, alreadyOn = false) => {
  const courseNavItemA = doc.querySelector('nav[role="navigation"] li.breadcrumb-item:nth-child(3) > a');
  if (courseNavItemA) {
    if (alreadyOn) {
      courseNavItemA.href = '#';
    } else {
      const indexHtmlFileName = safeFileName(getCourseName()) + '.html';
      courseNavItemA.href = '../' + indexHtmlFileName;
    }
  }
  return doc;
}

// async is important else fails silently
// TODO make faster by using https://stackoverflow.com/a/37576787 promise all and parsing, adding in paralel
/**
 * Resolves deeper Moodle Pages via background script because of cors to resolve links in html or 303 redirects
 * @param {*} writer The writer to write potential video into
 * @param {string} moodleUrl 
 */
// let TEST_ONLY_ONE_VIDEO = false;
const resolveDeepMoodleLinks = async (writer, moodleUrl) => {
  const moodleDeepUrlSchema = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/';
  const moodlePathSplit = moodleUrl.split('https://wuecampus2.uni-wuerzburg.de/moodle');
  if (moodlePathSplit.length < 2) {
    return;
  }

  const backgroundCorsRequest = {
    action: 'corsMoodleRequest',
    moodlePath: moodlePathSplit[1]
  };
  let textOrUrlOrStream = await browser.runtime.sendMessage(backgroundCorsRequest);

  // if returned is object it's stream like video to save
  // else either html with further edit or url for redirect urls
  // WAS AN IDEA BUT DISMISSED
  // if (typeof textOrUrlOrStream === 'object' && textOrUrlOrStream.stream && textOrUrlOrStream.streamUrl) {
  //   if (TEST_ONLY_ONE_VIDEO) {
  //     return;
  //   }
  //   TEST_ONLY_ONE_VIDEO = true;

  //   const urlParts = textOrUrlOrStream.streamUrl.split('/');
  //   // safe filename is important else it crashes
  //   let path = 'videos/' + safeFileName(decodeURIComponent(urlParts[urlParts.length - 1]));

  //   writeStreamIntoZip(writer,path,textOrUrlOrStream);
  //   return path;
  // }

  if (textOrUrlOrStream && textOrUrlOrStream.includes('<html') && textOrUrlOrStream.includes('</html>')) {
    let parser = new DOMParser();
    let linkedDoc = parser.parseFromString(textOrUrlOrStream, 'text/html');

    /* 
      URL Redirect Replace PART 
      Requires url to be read from html and given back to relink web url at main page
    */
    const redirectLinkDiv = linkedDoc.querySelector('div.urlworkaround');
    if (redirectLinkDiv) {
      const redirectLinkAtag = redirectLinkDiv.querySelector('a');
      if (redirectLinkAtag) {
        if (redirectLinkAtag.href.includes(moodleDeepUrlSchema)) {
          return await resolveDeepMoodleLinks(writer, redirectLinkAtag.href);
        } else {
          return redirectLinkAtag.href;
        }
      }
    }

    /* 
      One Video Type REPLACE PART
      Requires mp4 video to be found by clicking through dubious moodle forms, download mp4 and give local url to relink back
    */
    const videoIframe = linkedDoc.querySelector('iframe#contentframe');
    if (videoIframe) {
      const videoIntitateFrameSrcUrl = videoIframe.src;
      if (videoIntitateFrameSrcUrl) {
        try {
          const videoFrameSrcSplit = videoIntitateFrameSrcUrl.split('?');
          if (videoFrameSrcSplit.length === 2) {
            const videoSourceUrl = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/lti/launch.php?' + videoFrameSrcSplit[1];
            const dubiousMoodleForm = await fetch(videoSourceUrl).then(r => r.text());
            const dubiousFormDoc = parser.parseFromString(dubiousMoodleForm, 'text/html');
            const dubiousForm = dubiousFormDoc.querySelector('form');

            if (dubiousForm) {
              const realVideoUrl = dubiousForm.action;
              if (realVideoUrl) {

                const urlParts = realVideoUrl.split('/');
                // safe filename is important else it crashes
                let path = 'videos/' + safeFileName(decodeURIComponent(urlParts[urlParts.length - 1]));

                // TODO not blacklist host but find out why this host does not load currently and how to detect and prevent these cases of dead hosts in future with fetch like timeout e.g.
                // TODO https://medium.com/swlh/making-cancel-able-http-requests-with-javascript-fetch-api-f934bba18228 timeout after to long
                // if (!realVideoUrl.includes('forschung.mcm.uni-wuerzburg.de')) {
                const videoResponse = await fetch(realVideoUrl);
                if (videoResponse.ok) {
                  const videoStream = videoResponse.body
                  // await the write promise here else it overloads write process with concurrent streams
                  // videos are just to large and bitrate for many concurrent -> also way faster apparently to just stream 1 than like 3-5 at once
                  await writeStreamIntoZip(writer, path, videoStream);
                  return path;
                }
              }
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }


    /* 
      Other mediaplayer js plugin replace part 
      Requires video url to be found from some source tag, downloaded, html ripped for sub page and video in it relinked
      Then returns link to local sub page to relink in main page
    */
    const videoPluginDiv = linkedDoc.querySelector('div.mediaplugin_videojs');
    if (videoPluginDiv) {

      // TODO remove again
      // TEST_ONLY_ONE_VIDEO = true;

      const sourceElement = videoPluginDiv.querySelector('source');
      if (sourceElement) {
        try {
          const realVideoUrl = sourceElement.src;
          if (realVideoUrl) {

            const urlParts = realVideoUrl.split('/');
            // safe filename is important else it crashes
            let path = 'videos/' + decodeURIComponent(urlParts[urlParts.length - 1]);

            const videoResponse = await fetch(realVideoUrl);
            if (videoResponse.ok) {
              // await the write promise here else it overloads write process with concurrent streams
              // videos are just to large and bitrate for many concurrent -> also way faster apparently to just stream 1 than like 3-5 at once
              await writeStreamIntoZip(writer, path, videoResponse.body);
              return path;
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }

      // Ansatz die ganze sub seite mit dem plugin zu übernehmen aber erstmal verworfen
      // const titleH2 = linkedDoc.querySelector('#region-main > div[role="main"] > h2');
      // if (!titleH2) {
      //   // TODO error handling
      //   alert('Seiten Name nicht gefunden, wird übersprungen');
      //   return;
      // }
      // let path = 'videoPages/' + safeFileName(titleH2.innerText + '.html');

      // // start doc
      // let doc = await getRelevantPageContent(writer, linkedDoc);

      // // get linked files in folder
      // doc = await downloadReplaceSmallFileLinks(writer, doc, '../');
      // doc = addLinkBackToCourseToNav(doc);

      // // convert to html and save
      // const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
      // addTextFileToArchive(writer, path, htmlWithDoctype)
      // return path;
    }


    /*
      Folder Part and assignment pages 
      Both require html to be ripped and linked pluginfiles to be ripped and relinked
    */
    const foldertreeDiv = linkedDoc.querySelector('div.foldertree');
    const submissionsTableDiv = linkedDoc.querySelector('div.submissionstatustable');
    const lightBoxGalleryDiv = linkedDoc.querySelector('div.lightbox-gallery');
    if (foldertreeDiv || submissionsTableDiv || lightBoxGalleryDiv) {
      // TODO do something like this
      // return backupFolder(writer,linkedDoc, doc);

      const navBarLastItemTitle = linkedDoc.querySelector('div#page-navbar > nav > ul > li:last-of-type > a');
      if (navBarLastItemTitle) {
        navBarLastItemTitle.href = '#';
      }

      const contentTitleH2 = linkedDoc.querySelector('#region-main > div[role="main"] > h2');
      const header = contentTitleH2 || navBarLastItemTitle;
      if (!header) {
        console.warn('Seiten Name nicht gefunden, wird übersprungen: ' + moodleUrl);
        return;
      }

      let path = 'folderPages/';
      if (submissionsTableDiv) {
        path = "submissions/"
      }
      path += safeFileName(header.innerText + '.html');

      // start doc
      let doc = await getRelevantPageContent(writer, linkedDoc);

      // get linked files in folder/assignment
      doc = await downloadReplaceDirectLinkedFileLinks(writer, doc, '../');
      doc = addLinkBackToCourseToNav(doc);

      // convert to html and save
      const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
      addTextFileToArchive(writer, path, htmlWithDoctype)
      return path;
    }


    /* 
      Page and Rating allocate Download Part 
      Both require html to be ripped, files linked there to be downloaded linked in sub page and local link to subpage given back to relink
    */
    // generalPageBox kind of a fallback since things like folder or choice also contain it
    const generalPageBox = linkedDoc.querySelector('.generalbox');
    const choiceStatusTable = linkedDoc.querySelector('div.choicestatustable');
    if (generalPageBox || choiceStatusTable) {
      const navBarLastItemTitle = linkedDoc.querySelector('div#page-navbar > nav > ul > li:last-of-type > a');
      if (navBarLastItemTitle) {
        navBarLastItemTitle.href = '#';
      }

      const contentTitleH2 = linkedDoc.querySelector('#region-main > div[role="main"] > h2');
      const header = contentTitleH2 || navBarLastItemTitle;
      if (!header) {
        console.warn('Seiten Name nicht gefunden, wird übersprungen: ' + moodleUrl);
        return;
      }
      let path = 'subPages/' + safeFileName(header.innerText) + '.html';

      let doc = await getRelevantPageContent(writer, linkedDoc);
      doc = addLinkBackToCourseToNav(doc);
      const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
      addTextFileToArchive(writer, path, htmlWithDoctype)
      return path;
    }

  }

  if (textOrUrlOrStream.includes(moodleDeepUrlSchema)) {
    return await resolveDeepMoodleLinks(writer, redirectLinkAtag.href);
  }
  return textOrUrlOrStream;
};

/**
 * Replaces moodle links/videos which link to site which show resource with direct links to resources
 * @param {*} writer The writer to write potential video into
 * @param {document} doc The document of the course containing links which shoudl be local ones
 */
const replaceMoodleDeepLinks = async (writer, doc) => {
  const moodleUrlStart = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/'

  // Add new supported url types to query here
  const supportedMoodleUrlSchemes = {
    // TODO stop data save mode and reactivate
    urlSchema: 'url/',
    videoUrlSchema: 'lti/',
    pageLinkUrlSchema: 'page/',
    folderUrlSchema: 'folder/',
    ratingAllocateUrlSchema: 'ratingallocate/',
    choiceUrlSchema: 'choice/',
    assignUrlSchema: 'assign/',
    lightboxGallerUrlSchema: 'lightboxgallery/',
  }

  // construct selector that selects all links for all supported schemes
  // selectors like these `a[href^="https://wuecampus2.uni-wuerzburg.de/moodle/mod/folder/"], ` combined with commas
  let urlAndVideoUrlTypeSelector = '';
  let allUrls = Object.values(supportedMoodleUrlSchemes);
  for (let i = 0; i < allUrls.length; i++) {
    if (i > 0) {
      urlAndVideoUrlTypeSelector += ', ';
    }
    const combinedUrl = moodleUrlStart + allUrls[i];
    urlAndVideoUrlTypeSelector += `a[href^="${combinedUrl}"]`
  }

  const linkElements = doc.querySelectorAll(urlAndVideoUrlTypeSelector);
  for (let i = 0; i < linkElements.length; i++) {
    const element = linkElements[i];

    element.href = element.href.replace('&redirect=1', '');

    // was an idea but dismissed
    // const activityImageTag = element.querySelector('img');
    // if (activityImageTag.src.includes('mpeg')) {
    //   // is mpeg video so add redirect 1 to directly download
    //   // Find out if only should add redirect to mpeg activities
    //   // bit of a hack to save myself from some things
    //   if (!element.href.includes('?')) {
    //     element.href += '?';
    //   }
    //   element.href += '&redirect=1';
    // }

    const returnedPath = await resolveDeepMoodleLinks(writer, element.href);
    linkElements[i].href = returnedPath;

    // await waitHumanLikeTime(150);
  }

  return doc;
}

/**
 * Downloads small files like pdfs into zip and replaces links to them
 * @param {*} writer Writer to write linked resources backups to
 * @param {*} doc Doc to get resources from and relink resources in
 * @param {string} localFileLinkPrefix Prefix for local files linked. Used by web pages in sub folders to get back to root
 * @return {Promise<document>}
 */
const downloadReplaceDirectLinkedFileLinks = async (writer, doc, localFileLinkPrefix = '') => {
  const moodleResourceViewUrlSchema = 'https://wuecampus2.uni-wuerzburg.de/moodle/mod/resource/view.php?';
  const moodleResourcePhpUrlSchema = 'https://wuecampus2.uni-wuerzburg.de/moodle/pluginfile.php/';
  // selector to both select url and video link a tags
  const resourceUrlTypeSelector = 'a[href^="' + moodleResourceViewUrlSchema + '"], a[href^="' + moodleResourcePhpUrlSchema + '"]';
  const linkElements = doc.querySelectorAll(resourceUrlTypeSelector);

  let alreadyExistingPath = [];
  let alreadyExitingPathUrlSame = [];
  for (let i = 0; i < linkElements.length; i++) {

    // Fallback name TODO better one maybe? but should not show
    // TODO other method of getting name via instance title
    // let fileName = new Date().toUTCString;
    // const instanceName = element.querySelector('span.instancename');
    // if (instanceName) {
    //   instanceName.querySelector('span.accesshide').remove();
    //   fileName = instanceName.innerText;
    // }

    const element = linkElements[i];

    // remove to attach not double
    element.href = element.href.replace('&redirect=1', '')
    if (element.href.includes('?')) {
      element.href += '&redirect=1';
    } else {
      element.href += '?redirect=1'
    }

    try {
      // console.log("Fetched file at ms: " + new Date().getMilliseconds());
      const fileResponse = await fetch(element.href);
      const fileStream = fileResponse.body;

      // TODO maybe alert that some were not backuped?
      if (fileResponse.ok) {
        // gets name from file url not activity name
        const fileNameSplit = fileResponse.url.split('/');

        let fileEnding = fileNameSplit[fileNameSplit.length - 1].split('.')[1];
        // make sure to not include query like ?forcedownload
        const splitQueryEnding = fileEnding.split('?');
        fileEnding = splitQueryEnding[0];

        // check agains array of names already used to not create duplicates
        let fileName = decodeURIComponent(fileNameSplit[fileNameSplit.length - 1].split('.')[0]);

        // safe filename is important else it crashes
        let path = 'Dateien/' + safeFileName(fileName) + '.' + fileEnding;

        // if (fileResponse.url.includes('esearch-based_web_design_and_usability_guidelines')) {
        //   // console.debug(downloadedUrls);
        //   // console.log(fileResponse.url);
        //   // console.log(downloadedUrls.includes(fileResponse.url));
        //   debugger;
        // }

        let foundSameBlobs = false;
        if (alreadyExistingPath.includes(path)) {
          for (let i = 0; i < alreadyExistingPath.length; i++) {
            if (alreadyExistingPath[i] === path) {
              let previousDownloadBlob = await fetch(alreadyExitingPathUrlSame[i]).then((r) => r.blob());
              // habe to clone fileResponse because `fileStream = fileResponse.body` locks response
              // see https://stackoverflow.com/a/54115314
              let currentDownloadBlob = await fileResponse.clone().blob();

              // check if blobs are same size
              if (previousDownloadBlob.size === currentDownloadBlob.size) {
                foundSameBlobs = true;
                break;
              }
            }
          }

          if (!foundSameBlobs) {
            // rename if not same file as previous
            fileName += '-I';
            path = 'Dateien/' + safeFileName(fileName) + '.' + fileEnding;
          }
        }

        if (!foundSameBlobs) {
          // only download new one if not same files as previously
          await writeStreamIntoZip(writer, path, fileStream);
        }

        // THIS ONE
        // session_06 2007_research-based_web_design_and_usability_guidelines-I
        // if (element.href.includes('https://wuecampus2.uni-wuerzburg.de/moodle/mod/resource/view.php?id=1286913')) {  const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
        //   debugger;
        // }

        linkElements[i].href = localFileLinkPrefix + path;
        linkElements[i].setAttribute('onClick', '');


        // save path and url downloaded to compare later
        alreadyExistingPath.push(path);
        alreadyExitingPathUrlSame.push(fileResponse.url);
      }
    } catch (e) {
      console.error(e);
    }
    // await waitHumanLikeTime(150);
  }

  return doc;
}

/**
 * Downloads files like images which are embeded directly in the written html
 * @param {*} writer Writer to write linked resources backups to
 * @param {*} doc Doc to get resources from and relink resources in
 * @param {string} localFileLinkPrefix Prefix for local files linked. Used by web pages in sub folders to get back to root
 * @return {Promise<document>}
 */
// TODO conceptunally keep this
const downloadLinkEmbededMediaElements = async (writer, doc, localFileLinkPrefix = '') => {
  // selector to both select url and video link a tags

  // TODO expand selector here when more types of tags with sources emebed surface
  // find tags which are of interest to backup
  const imageWithSourceSelector = 'img[src]';
  const toBackupElements = doc.querySelectorAll(imageWithSourceSelector);

  let alreadyExistingPaths = [];
  for (let i = 0; i < toBackupElements.length; i++) {
    const element = toBackupElements[i];

    // Was an idea but probably not needed?
    // if (getComputedStyle(element, null).display === 'none') {
    //   // This element would not be seen so don't download and copy
    //   continue;
    // }

    try {
      const fileResponse = await fetch(element.src);
      const fileStream = fileResponse.body;

      // TODO maybe alert that some were not backuped?
      if (fileResponse.ok) {
        // gets name from file url not activity name
        const fileNameSplit = fileResponse.url.split('/');

        let fileEnding = fileNameSplit[fileNameSplit.length - 1].split('.')[1];
        if (fileEnding) {
          // make sure to not include query like ?forcedownload
          const splitQueryEnding = fileEnding.split('?');
          fileEnding = splitQueryEnding[0];
        } else {
          const contentType = fileResponse.headers.get('Content-Type');
          // got from here https://stackoverflow.com/a/48704300 maybe see again when audio or video may be needed
          switch (contentType) {
            case 'image/gif':
              fileEnding = 'gif'
              break;
            case 'image/jpeg':
              fileEnding = 'jpg'
              break;
            case 'image/png':
              fileEnding = 'png'
              break;
            case 'image/tiff':
              fileEnding = 'tiff'
              break;
            case 'image/svg+xml':
              fileEnding = 'svg'
              break;
          }
          if (!fileEnding) {
            // if still no file ending skip this file and let it be retrieved from web
            continue;
          }
        }

        // check agains array of names already used to not create duplicates
        let fileName = decodeURIComponent(fileNameSplit[fileNameSplit.length - 1].split('.')[0]);

        // safe filename is important else it crashes
        let path = 'webImages/' + safeFileName(fileName) + '.' + fileEnding;

        if (!alreadyExistingPaths.includes(path)) {
          // save path and url downloaded to compare later
          alreadyExistingPaths.push(path);
  
          // only download new one if not same files as previously
          await writeStreamIntoZip(writer, path, fileStream);
        }

        toBackupElements[i].src = localFileLinkPrefix + path;
      }
    } catch (e) {
      console.error(e);
    }
    // await waitHumanLikeTime(150);
  }

  return doc;
}

/**
 * Writes file with current time as lastModified and given text and path into zip
 * @param {W} writer Writer to write into
 * @param {string} path Path of new file in zip
 * @param {string} text Text to write into file
 */
const addTextFileToArchive = (writer, path, text) => {
  // don't await wrie here because it's just text files so not that much bandwidth
  // can handle multiple concurrent
  writeStreamIntoZip(writer, path, new Response(text).body);
}

/**
 * Clones current page, removes useless things and saves external resources locally and relinks
 * @param {*} writer 
 * @param {document} inputDoc The input doc from which to copy
 */
const getRelevantPageContent = async (writer, inputDoc) => {
  let doc = getBasicCleanDocumentClone(inputDoc);
  doc = addRelevantHtmlToDoc(inputDoc, doc);
  doc = await addExternalResourcesToDoc(writer, inputDoc, doc);
  doc = await downloadLinkEmbededMediaElements(writer, doc);
  return doc;
}

const archiveCourse = async () => {
  // signal user that is running
  buttonInProgress(true);

  const { readable, writable } = new Writer();
  const writer = writable.getWriter();

  /* Creating complicated file stream zip object */
  let todayString = new Date().toISOString().slice(0, 10);
  let archiveName = 'archive-' + safeFileName(getCourseName()) + '-' + todayString + '.zip';
  const fileStream = streamSaver.createWriteStream(archiveName);
  readable.pipeTo(fileStream);

  /* Creating a html document element backup of basic moodle course page */
  let doc = await getRelevantPageContent(writer, document);

  // TODO make possible to save with and without videos
  doc = await replaceMoodleDeepLinks(writer, doc);

  // TODO reactivate
  doc = await downloadReplaceDirectLinkedFileLinks(writer, doc);

  // one small fix
  doc = addLinkBackToCourseToNav(doc, true);
  // add html to zip finally
  const htmlWithDoctype = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
  const htmlFileName = safeFileName(getCourseName()) + '.html';
  addTextFileToArchive(writer, htmlFileName, htmlWithDoctype)

  //////////////////////////////////////////

  // Finalise zip and download
  writer.close();
  // allow download again
  buttonInProgress(false);
};

browser.runtime.sendMessage({}, () => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      addArchiveDownloadBtn();
    }
  }, 10);
});