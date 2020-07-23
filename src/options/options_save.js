/*global browser*/
/*eslint no-undef: "error"*/

const saveSettings = () => {
  browser.storage.local.set({
    username: document.getElementById('username').value.toLowerCase(),
    password: document.getElementById('password').value,
    courseUrl: document.getElementById("courses").value,
    autoLogin: document.getElementById('autoLogin').checked,
    autoDateScroll: document.getElementById('autoDateScroll').checked,
  });
};

// prefills field with values from storage
const preloadFieldsValue = async (credsObj) => {
  // console.log(credsObj);
  if (credsObj.username !== undefined) {
    document.getElementById('username').value = credsObj.username;
  }
  if (credsObj.password !== undefined) {
    document.getElementById('password').value = credsObj.password;
  }

  // reflect default behaviour as seeing as checked before first open of settings start
  if (credsObj.autoLogin === undefined) {
    document.getElementById('autoLogin').checked = true;
  } else {
    document.getElementById('autoLogin').checked = credsObj.autoLogin;
  }

  // reflect default behaviour as seeing as checked before first open of settings start
  if (credsObj.autoDateScroll === undefined) {
    document.getElementById('autoDateScroll').checked = true;
  } else {
    document.getElementById('autoDateScroll').checked = credsObj.autoDateScroll;
  }

  // get options for courses from current json
  const jsonOptions = await fetch('https://wuel.de/courses.json').then((r) => r.json());
  
  let select_elem = document.getElementById('courses');
  jsonOptions.forEach((element) => {
    let option_elem = document.createElement('option');
    option_elem.value = element.href;
    option_elem.textContent = element.name;
    select_elem.appendChild(option_elem);
  });

  // try to restore correct option froms storage
  if (credsObj.courseUrl !== undefined) {
    document.getElementById("courses").value = credsObj.courseUrl;
  }
};

const onLoginPageError = (error) => {
  console.log(`Error: ${error}`);
};

window.onload = () => {

  // need to attach event handler cause onlclick attribute is conten security policy disallowed cause inline
  document.getElementById('saveBtn').onclick = saveSettings;

  // get creds and prefill
  const getPromise = browser.storage.local.get(['username', 'password', 'courseUrl', 'autoLogin', 'autoDateScroll']);
  getPromise.catch(onLoginPageError);
  getPromise.then(preloadFieldsValue);
};