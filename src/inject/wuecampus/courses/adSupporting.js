// TODO research if viable how much per view and if possible or verified and so on
// TODO execute after load same as others
// TODO check localstorage if opt in was given
let sidebar = document.querySelector('section.hidden-print');
if (sidebar) {
  // TODO query intermittent aside tag and append to that if exists ?
  const aside = sidebar.querySelector('aside');
  if (aside) {
    sidebar = aside;
  }
  const lastSidebarOption = sidebar.querySelector('section.block:last-of-type');

  if (lastSidebarOption) {
    const adPart = lastSidebarOption.cloneNode(true);
    adPart.id = 'adBlock';
    // TODO maybe remove some more attrributes from it and subparts
    const adCardTitle = adPart.querySelector('.card-title ');
    if (adCardTitle) {
      adCardTitle.id = 'adTitle';
      adCardTitle.innerText = 'WueXtension Werbe-Unterstützung';
    }

    const adCardText = adPart.querySelector('.card-text');
    if (adCardText) {
      // TODO add add content here
      adCardText.innerHTML = '';
    }

    sidebar.appendChild(adPart);
  }

}
