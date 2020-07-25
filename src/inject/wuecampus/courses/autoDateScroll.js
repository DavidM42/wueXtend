const onAutoDateScrollConfig = (credsObj) => {
  const autoDateScroll = credsObj.autoDateScroll;

  if (autoDateScroll !== false) {
    const firstPofTopics = document.querySelectorAll('ul.topics > li.section > div.content > div.summary > div > p:first-of-type');

    if (firstPofTopics) {
      let nearestDate = {
        timedelta: Number.MAX_VALUE,
        scrollParentElement: null
      };
      for (let i = 0; i < firstPofTopics.length; i++) {
        const parentToScrollTo = firstPofTopics[i].parentNode.parentNode.parentNode;

        let element = firstPofTopics[i];
        if (element) {
          let dateText = element.innerText;
          if (element.childElementCount > 0 && element.firstChild.innerText) {
            dateText = element.firstChild.innerText;
          }

          if (dateText) {
            // sometimes more than one date linked with & so take first
            dateText = dateText.split('&')[0].split('und')[0];

            const dateSplit = dateText.split('.');
            if (dateSplit && dateSplit.length === 3) {
              const monthStartingFromZero = Number.parseInt(dateSplit[1]) - 1;
              const iterationDate = new Date(dateSplit[2], monthStartingFromZero, dateSplit[0]);

              const previousDateTimedelta = new Date() - iterationDate;
              const futureDateTimedelta = iterationDate - new Date();

              let iterationAbsoluteTimedelta = futureDateTimedelta;
              if (futureDateTimedelta < 0 && previousDateTimedelta >= 0) {
                iterationAbsoluteTimedelta = previousDateTimedelta;
              }

              if (iterationAbsoluteTimedelta < nearestDate.timedelta) {
                nearestDate = {
                  timedelta: iterationAbsoluteTimedelta,
                  scrollParentElement: parentToScrollTo
                };
              }
            }
          }
        }
      }
      if (nearestDate.scrollParentElement) {
        // TODO maybe remove 3px from padding to not make it move or find other way to do that
        // const wasPadding = window.getComputedStyle( nearestDate.scrollParentElement, null).getPropertyValue("padding");
        nearestDate.scrollParentElement.style = 'border: 3px dotted red;';
        nearestDate.scrollParentElement.scrollIntoView(true, {
          block: 'start',
          behavior: 'smooth'
        });
      }
    }
  }
};

const onAutoDateScrollError = (error) => {
  console.log(`Error: ${error}`);
};

// TODO make it work for date in title like this https://wuecampus2.uni-wuerzburg.de/moodle/course/view.php?id=35504
browser.runtime.sendMessage({}).then(() => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      const autoLoginPromise = browser.storage.local.get(['autoDateScroll']);
      autoLoginPromise.then(onAutoDateScrollConfig).catch(onAutoDateScrollError);
    }
  }, 10);
});
