const leaveButtonTemplate = `
<div class="studentdash nav-item nav-link" style="padding: 0 3px 0 2px;">
    <a role="button" title="Leave course" class="btn btn-secondary fhs-tooltip" id="logoutBtnA">
        <i class="fa fa-sign-out"></i>
    </a>
</div>
`;

const addEnrollmentButton = () => {
  let logoutBtn = document.getElementById('logoutBtnA');
  // don't add multiple logout btn
  if (!logoutBtn) {

    const parentElements = document.getElementsByClassName('studentselfenrole');
    if (parentElements.length === 1) {
      const aElements = parentElements[0].getElementsByTagName('a');
      if (aElements.length === 1) {
        const enrollmentLink = aElements[0].href;

        const courseControls = document.getElementsByClassName('coursecontrols');
        if (courseControls.length === 1) {
          // add btn template 
          courseControls[0].innerHTML += leaveButtonTemplate;

          // and link to leave into dom 
          logoutBtn = document.getElementById('logoutBtnA');
          logoutBtn.href = enrollmentLink;
        }
      }
    }
  }
};

// eslint-disable-next-line no-undef
browser.runtime.sendMessage({}).then(() => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      /* Adding button to easily leave course here  */
      addEnrollmentButton();
    }
  }, 10);
});