import Cookies              from 'js-cookie';
import { defaultSettings }  from './client-settings';
import { SAVED_CREDS_KEY}   from './constants';

import keys                 from 'lodash/keys';

// even though this code shouldn't be used server-side, node will throw
// errors if "window" is used
const root = Function("return this")() || (42, eval)("this");

// stateful variables that persist throughout session
root.authState = { currentSettings: defaultSettings };

export function setCurrentSettings (s) {
  root.authState.currentSettings = s;
}

export function getCurrentSettings () {
  return root.authState.currentSettings;
}

export function destroySession () {
  const sessionKeys = [SAVED_CREDS_KEY];

  keys(sessionKeys).forEach((key) => {
    const value = sessionKeys[key];

    if (root.localStorage) {
      root.localStorage.removeItem(value);
    }

    Cookies.remove(value, { path: root.authState.currentSettings.cookiePath || '/' });
  });
}

function unescapeQuotes (val) {
  return val && val.replace(/("|')/g, '');
}

export function getSignOutUrl() {
  return `${getApiUrl()}${root.authState.currentSettings.signOutPath}`
}

export function getTokenValidationPath() {
  return `${getApiUrl()}${root.authState.currentSettings.tokenValidationPath}`
}

export function getOAuthUrl ({ provider, params }) {
  let oAuthUrl = `${getApiUrl()}${root.authState.currentSettings.authProviderPaths[provider]}?auth_origin_url=${encodeURIComponent(root.location.href)}`;

  if (params) {
    for(const key in params) {
      oAuthUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }
  }

  return oAuthUrl;
}

export function getApiUrl() {
  return root.authState.currentSettings.apiUrl;
}

export function getTokenFormat() {
  return root.authState.currentSettings.tokenFormat;
}

export function persistData(key, val) {
  const valInJson = JSON.stringify(val);

  switch (root.authState.currentSettings.storage) {
    case 'localStorage':
      root.localStorage.setItem(key, valInJson);
      break;

    default:
      Cookies.set(key, valInJson, {
        expires: root.authState.currentSettings.cookieExpiry,
        path:    root.authState.currentSettings.cookiePath
      });
      break;
  }
}

export function retrieveData(key) {
  let val = null;

  switch (root.authState.currentSettings.storage) {
    case 'localStorage':
      val = root.localStorage && root.localStorage.getItem(key);
      break;

    default:
      val = Cookies.get(key);
      break;
  }

  try {
    return JSON.parse(val);
  } catch (err) {
    return unescapeQuotes(val);
  }
}