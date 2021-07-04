/**
 * Checks if login info was already autofilled by password manager or other extensions
 * @param usernameElement {HTMLElement}
 * @param passwordElement {HTMLElement}
 */
const loginInfoWasPreFilled = (usernameElement, passwordElement) => {
  const username = usernameElement.value;
  const password = passwordElement.value;
  return username && password;
};

const loginForm = (username, password) => {
  // username keeps getting uppercase so check for that here
  if (username[0] === 'S') {
    username = username.toLowerCase();
  }

  const loginClassElements = document.getElementsByClassName('input_login_hisinone');

  // login Form if you try to access reserved site without beeing logged in
  const loginForm = document.getElementById('login');
  const loginFormInputs = document.getElementsByClassName('input_login');

  // html elements to find and use later
  let usernameElement;
  let passwordElement;
  let loginButton;

  if (loginForm || loginClassElements.length > 0) {
    console.log('You are not logged in');

    const error_infoboxes = document.getElementsByClassName('error_infobox');
    if (error_infoboxes.length === 0) {

      // if loginForm on page exists use this for premium login with redirect
      if (loginForm) {
        console.log('Will log in now and redirect');
        // filling out info not using ids cause seem randomized

        for (let i = 0; i < loginFormInputs.length; i++) {
          const element = loginFormInputs[i];

          const type = element.type;
          if (type === 'text') {
            usernameElement = element;
          } else if (type === 'password') {
            passwordElement = element;
          }
        }

        loginButton = document.getElementsByClassName('submit_highlighted')[0];
      } else {
        console.log('Will log in now and go to main page');
        // else fallback to top of page which redirects to index site
        // filling out info not using ids cause seem randomized TODO maybe not language change safe
        for (let i = 0; i < loginClassElements.length; i++) {
          const element = loginClassElements[i];
          const title = element.title.toLowerCase();
          if (title.includes('benutzername') || title.includes('user name')) {
            usernameElement = element;
          } else if (title.includes('passwor')) { //works for both language cases passwort and password
            passwordElement = element;
          }
        }
        loginButton = document.getElementById('loginForm:login');
        if (!loginButton) {
          // other class name on mobile site
          loginButton = document.getElementsByClassName('mobileLoginButton')[0];
        }
      }

      if (!usernameElement || !passwordElement) {
        console.warn('Could not find username and password fields');
      }

      // username/password was pre filled by e.g. password manager
      // just click login button
      if (loginInfoWasPreFilled(usernameElement, passwordElement)) {
        loginButton.click();
      } else {
        if (!username && !password) {
          // should not try to login if both are empty
          // undefined cases for new installs is catched earlier and ripPasswords attached
          // but if were explicitly cleared then this should catch it
          console.warn('No stored username/password in extension and no password manager prefilling. Cannot login automatically');
          return;
        }
        usernameElement.value = username;
        passwordElement.value = password;
        loginButton.click();
      }
    } else {
      console.log('Login failed previously');
      alert('Login failed. Check credentials in addon settings');
    }
  }
};

const ripPasswordsFromForm = () => {
  let username = null;
  let password = null;

  const loginClassElements = document.getElementsByClassName('input_login_hisinone');
  if (loginClassElements.length > 0) {
    const error_infoboxes = document.getElementsByClassName('error_infobox');
    if (error_infoboxes.length === 0) {
      for (let i = 0; i < loginClassElements.length; i++) {
        const element = loginClassElements[i];
        const title = element.title.toLowerCase();

        const titleHasUsername = title.includes('benutzername') || title.includes('user name');
        const titleHasPassword = title.includes('passwor');
        if (titleHasUsername && element.value) {
          username = element.value;
        } else if (titleHasPassword && element.value) { //works for both language cases passwort and password
          password = element.value;
        }
      }
    }
  }

  if (username !== null && password !== null) {
    console.log('Will save settings received from form');
    saveSettings(username, password);
  }
};


const onCredsGot = (credsObj) => {
  const username = credsObj.username;
  const password = credsObj.password;
  const autoLogin = credsObj.autoLogin;

  if (username === undefined || password === undefined) {
    // if no username password were set get the ones entered on first login onclick of loginBtn
    const loginButton = document.getElementById('loginForm:login');

    if (!loginButton) {
      console.warn('Login button was not found!');
    }

    loginButton.onclick = ripPasswordsFromForm;
  } else {
    // auto login turn of setting
    if (autoLogin !== false) {
      // auto login if creds were set
      loginForm(username, password);
    }
  }

};

const onAnyPageError = (error) => {
  console.log(`Error: ${error}`);
};

browser.runtime.sendMessage({}).then(() => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      // handle login if not logged in
      // would like sync storagearea not local but android firefox does not support I think
      // need storage permission
      const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin']);
      getPromise.then(onCredsGot).catch(onAnyPageError);
    }
  }, 10);
});