"use strict";

function getAccessToken() {
  return sessionStorage.getItem(
    window.AUTH_CONFIG.TOKEN_STORAGE_KEY
  );
}

function redirectToAccessGate() {
  const returnUrl = encodeURIComponent(window.location.href);

  window.location.href =
    `${window.AUTH_CONFIG.LOGIN_URL}` +
    `?app=${encodeURIComponent(window.AUTH_CONFIG.APP_CODE)}` +
    `&return_url=${returnUrl}`;
}

function requireAuthentication() {
  const url = new URL(window.location.href);
  const tokenFromUrl = url.searchParams.get("access_token");

  if (tokenFromUrl) {
    sessionStorage.setItem(
      window.AUTH_CONFIG.TOKEN_STORAGE_KEY,
      tokenFromUrl
    );

    url.searchParams.delete("access_token");
    window.history.replaceState({}, "", url.toString());
  }

  if (!getAccessToken()) {
    redirectToAccessGate();
    return false;
  }

  return true;
}

function authHeaders(extraHeaders = {}) {
  const token = getAccessToken();

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`
  };
}

window.OSE_AUTH = {
  getAccessToken,
  requireAuthentication,
  redirectToAccessGate,
  authHeaders
};

document.addEventListener("DOMContentLoaded", () => {
  window.OSE_AUTH.requireAuthentication();
});