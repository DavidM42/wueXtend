const onCreated = () => {};

const onErrorAction = (err) => {
  console.error(err);
};

const onCourseUrl = (retrieved) => {
  let openUrl = 'https://wuel.de';
  const courseUrl = retrieved.courseUrl;

  if (courseUrl && courseUrl.trim().replace('/', '').length > 0) {
    openUrl += courseUrl;
  }

  var creating = browser.tabs.create({
    url: openUrl
  });
  creating.then(onCreated, onErrorAction);
};

const getPromise = browser.storage.local.get('courseUrl')
  .then(onCourseUrl)
  .catch(onErrorAction)
  .finally(() => {
    // if worked or not always close windows after it
    window.close();
  });

