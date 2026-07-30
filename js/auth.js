"use strict";
(() => {
  const cfg = window.AUTH_CONFIG;
  if (!cfg) throw new Error("AUTH_CONFIG is not loaded.");

  function getAccessToken() {
    return localStorage.getItem(cfg.TOKEN_STORAGE_KEY);
  }

  function clearSession() {
    localStorage.removeItem(cfg.TOKEN_STORAGE_KEY);
    localStorage.removeItem(cfg.TOKEN_EXPIRES_AT_KEY);
  }

  function saveSession(token, expiresAtSeconds) {
    localStorage.setItem(cfg.TOKEN_STORAGE_KEY, token);
    localStorage.setItem(cfg.TOKEN_EXPIRES_AT_KEY, String(expiresAtSeconds));
  }

  function sessionExpired() {
    const expiresAt = Number(localStorage.getItem(cfg.TOKEN_EXPIRES_AT_KEY) || 0);
    return !expiresAt || Date.now() >= expiresAt * 1000;
  }

  function redirectToAccessGate() {
    clearSession();
    const url = new URL(cfg.ACCESS_GATE_URL);
    url.searchParams.set("return_url", window.location.origin + window.location.pathname);
    window.location.replace(url.toString());
  }

  function consumeGatewayFragment() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const app = params.get("app");
    const expiresAt = Number(params.get("expires_at") || 0);
    if (!token || app !== cfg.APP_CODE || !expiresAt) return null;
    saveSession(token, expiresAt);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return token;
  }

  async function verifyToken(token) {
    const apiBase = ((window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "").replace(/\/$/, "");
    if (!apiBase) throw new Error("APP_CONFIG.API_BASE_URL is not configured.");
    const response = await fetch(`${apiBase}${cfg.BACKEND_VERIFY_PATH}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return false;
    const data = await response.json().catch(() => ({}));
    if (data.expires_at) localStorage.setItem(cfg.TOKEN_EXPIRES_AT_KEY, String(data.expires_at));
    return data.valid === true && data.app_id === cfg.APP_CODE;
  }

  function showApp() {
    document.documentElement.classList.remove("auth-pending");
  }

  async function requireAuthentication() {
    const token = consumeGatewayFragment() || getAccessToken();
    if (!token || sessionExpired()) {
      redirectToAccessGate();
      return false;
    }
    try {
      if (!(await verifyToken(token))) {
        redirectToAccessGate();
        return false;
      }
    } catch (error) {
      console.error("Access verification failed:", error);
      redirectToAccessGate();
      return false;
    }
    showApp();
    return true;
  }

  window.OSE_AUTH = Object.freeze({
    getAccessToken,
    clearSession,
    redirectToAccessGate,
    requireAuthentication
  });

  requireAuthentication();
})();
