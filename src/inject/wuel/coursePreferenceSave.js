const saveCoursePreference = (courseUrlPath) => {
  browser.storage.local.set({
    courseUrl: courseUrlPath,
  });
};



browser.runtime.sendMessage({}, () => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      const courseATags = document.querySelectorAll('a.courseLink');
      for (let aTag of courseATags) {
        aTag.onclick = () => {
          const preferredCourse = aTag.href.replace('https://wuel.de', '')
          console.log("Saving " + preferredCourse + ' as preferred wuel course')
          saveCoursePreference(preferredCourse);
        }
      }
    }
  }, 10);
});