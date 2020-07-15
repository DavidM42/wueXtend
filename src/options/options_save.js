/*global browser*/
/*eslint no-undef: "error"*/

const saveSettings = () => {
  browser.storage.local.set({
    username: document.getElementById('username').value.toLowerCase(),
    password: document.getElementById('password').value,
    autoLogin: document.getElementById('autoLogin').checked,
    autoDateScroll: document.getElementById('autoDateScroll').checked,
  });
};

// prefills field with values from storage
const preloadFieldsValue = (credsObj) => {
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
};

const onLoginPageError = (error) => {
  console.log(`Error: ${error}`);
};

window.onload = () => {

  // need to attach event handler cause onlclick attribute is conten security policy disallowed cause inline
  document.getElementById('saveBtn').onclick = saveSettings;

  // get creds and prefill
  const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin', 'autoDateScroll']);
  getPromise.then(preloadFieldsValue).catch(onLoginPageError);
};