

const firstPofTopics = document.querySelectorAll('ul.topics > li.section > div.content > div.summary > div > p:first-of-type');

if (firstPofTopics) {
    let nearestDate = {
        timedelta: Number.MAX_VALUE,
        scrollParentElement: null
    };
    for (let i = 0; i < firstPofTopics.length; i++) {
        let element = firstPofTopics[i];
        const parentToScrollTo = element.parentNode.parentNode.parentNode;
        
        let dateText = element.innerText;
        if (element.firstChild) {
            dateText = element.firstChild.innerText;
        }

        const dateSplit = dateText.split('.');
        if (dateSplit.length === 3) {
            const monthStartingFromZeo = Number.parseInt(dateSplit[1])-1;
            const iterationDate = new Date(dateSplit[2], monthStartingFromZeo, dateSplit[0]);

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
        };
    }
    if (nearestDate.scrollParentElement) {
        console.log(nearestDate);
        nearestDate.scrollParentElement.scrollIntoView();
    }
}
