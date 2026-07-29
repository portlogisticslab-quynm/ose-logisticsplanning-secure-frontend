"use strict";

function getAccessToken() {
  return sessionStorage.getItem(
    window.AUTH_CONFIG.TOKEN_STORAGE_KEY
  );
}

function saveAccessToken(token) {
  sessionStorage.setItem(
    window.AUTH_CONFIG.TOKEN_STORAGE_KEY,
    token
  );
}

function clearAccessToken() {
  sessionStorage.removeItem(
    window.AUTH_CONFIG.TOKEN_STORAGE_KEY
  );
}

function redirectToAccessGate() {
  const gatewayUrl = new URL(
    window.AUTH_CONFIG.ACCESS_GATE_URL
  );

  gatewayUrl.searchParams.set(
    "app",
    window.AUTH_CONFIG.APP_CODE
  );

  window.location.replace(gatewayUrl.toString());
}

function readTokenFromHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash) {
    return null;
  }

  const hashParams = new URLSearchParams(hash);

  const token = hashParams.get("access_token");
  const appCode = hashParams.get("app");

  if (!token) {
    return null;
  }

  if (appCode !== window.AUTH_CONFIG.APP_CODE) {
    return null;
  }

  saveAccessToken(token);

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search
  );

  return token;
}

function requireAuthentication() {
  const tokenFromGateway = readTokenFromHash();

  if (tokenFromGateway) {
    return true;
  }

  const storedToken = getAccessToken();

  if (storedToken) {
    return true;
  }

  redirectToAccessGate();
  return false;
}

window.OSE_AUTH = {
  getAccessToken,
  saveAccessToken,
  clearAccessToken,
  redirectToAccessGate,
  requireAuthentication
};

window.OSE_AUTH.requireAuthentication();