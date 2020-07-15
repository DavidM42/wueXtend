

const currentSemesterDiv = document.querySelector('div.jmu-mycourses > div:first-of-type');
if (currentSemesterDiv) {
  const courses = currentSemesterDiv.childNodes;

  const boxToInsertInto = document.querySelector('section#region-main');

  if (boxToInsertInto) {
    boxToInsertInto.style = `
            padding-top: 8px;
            margin-top: 8px;
        `;

    courses.forEach((course) => {
      const editCourse = course.cloneNode(true);

      const shortName = editCourse.title.split('_')[1];
      editCourse.innerHTML = `
                <h2 style="font-size: 1.4em; font-weight: 800;">
                    ${shortName}
                </h2>
                ${editCourse.innerText}
            `;
      // display: inline-block; width: 200px;

      boxToInsertInto.firstChild.before(editCourse);
    })
  }

}


const carouselImages = document.getElementById('fordsoncarousel');
if (carouselImages) {
  carouselImages.remove();
}