const usernameFieldId = 'horde_user';
const passwordFieldId = 'horde_pass';
const loginBtnFieldId = 'login-button';
const mobileLoginBtnSelector = 'input[name="login_button"]';


// lines below basically copy of wuecampus2 login code only other ids
const saveSettings = (usernameIn, passwordIn) => {
  browser.storage.local.set({
    username: usernameIn.toLowerCase(),
    password: passwordIn,
    // opt in cause important feature
    autoLogin: true
  });
};

const getLoginBtn = () => {
  let loginButton = document.getElementById(loginBtnFieldId);

  if (!loginButton) {
    loginButton = document.querySelector(mobileLoginBtnSelector);
  }
  return loginButton;
}

const fillOutLoginForm = (username, password) => {
  const usernameField = document.getElementById(usernameFieldId);
  const passwordField = document.getElementById(passwordFieldId);

  usernameField.value = username;
  passwordField.value = password;

  const loginButton = getLoginBtn();
  loginButton.click();
};

/**
 * Reads form and saves username and passwords into localstorage of extension
 */
const ripPasswordsFromForm = () => {
  const username = document.getElementById(usernameFieldId).value;
  const password = document.getElementById(passwordFieldId).value;
  console.log('Will save settings received from form');
  saveSettings(username, password);
};

// TODO write central js file for getting credentials from storage to use in this and wuestudy
/**
 * Called when credentials are managed by this extension and user data was retrieved
 * @param {*} credsObj Object with username,password and autoLogin property containing user preferences
 */
const onExtensionManagedCredsLogin = (credsObj) => {
  // console.log('got creds');
  // console.log(credsObj);
  const username = credsObj.username;
  const password = credsObj.password;
  const autoLogin = credsObj.autoLogin;

  if (!username || !password) {
    // if no username password were set get the ones entered on first login onclick of loginBtn
    const loginButton = getLoginBtn();

    // Only rip credentials to localstorage if consented by activating auto Login
    if (autoLogin !== false) {
      // TODO test if this works
      loginButton.onclick = ripPasswordsFromForm;
    }
  } else {
    // option to opt out of auto login
    if (autoLogin !== false) {
      // username/password combo set so login with these
      fillOutLoginForm(username, password);
    }
  }
};

/**
 * Checks if login info was already autofilled by password manager or other extensions
 */
const loginInfoWasPreFilled = () => {
  const username = document.getElementById(usernameFieldId).value;
  const password = document.getElementById(passwordFieldId).value;
  return username && password;
};

/**
 * Called when credentials were managed by password manager and autofill preference is retrieved
 * @param {*} credsObj Object containing preference for autologin in autoLogin property 
 */
const onPasswordManagedCredsLogin = (credsObj) => {
  const autoLogin = credsObj.autoLogin;

  // defaults to autoLogin but can be explicetly stopped in settings by unchecking checkbox
  if (autoLogin !== false) {
    console.log('Autofilled credentials found will auto login as wanted');
    const loginButton = getLoginBtn();
    if (loginButton) {
      loginButton.click()
    }
  }
};

const onLoginPageError = (error) => {
  console.log(`Error: ${error}`);
};

browser.runtime.sendMessage({}).then(() => {
  var readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      // document.getElementsByClassName('alert').length == 0
      // would like sync storagearea not local but android firefox does not support I think
      // need storage permission
      // TODO better if else for more readability
      const noLoginError = document.querySelector('ul.notices') === null;
      if (noLoginError) {
        if (loginInfoWasPreFilled()) {
          const autoLoginPromise = browser.storage.local.get(['autoLogin']);
          autoLoginPromise.then(onPasswordManagedCredsLogin).catch(onLoginPageError);
        } else {
          const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin']);
          getPromise.then(onExtensionManagedCredsLogin).catch(onLoginPageError);
        }
      } else {
        console.warn('Login error displayed: ' + noLoginError.innerText);
        // TODO if loginerrormessage other than sessionInvalid redirect to setttings of extension
      }

    }
  }, 10);
});