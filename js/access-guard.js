"use strict";

(() => {
  const cfg = window.APP_CONFIG || {};
  const ACCESS_GATE_URL = cfg.ACCESS_GATE_URL || "https://access-logisticsplanning.ose.vn/";
  const API_BASE_URL = String(cfg.API_BASE_URL || "").replace(/\/$/, "");
  const TOKEN_STORAGE_KEY = cfg.TOKEN_STORAGE_KEY || "logisticsplanning_access_token";
  const EXPIRES_STORAGE_KEY = cfg.EXPIRES_STORAGE_KEY || "logisticsplanning_access_expires_at";

  function clearAccessData() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRES_STORAGE_KEY);
  }

  function redirectToAccessGate() {
    window.location.replace(ACCESS_GATE_URL);
  }

  function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  function importTokenFromUrlFragment() {
    if (!window.location.hash || window.location.hash.length < 2) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");
    const expiresAt = params.get("expires_at");

    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (expiresAt && /^\d+$/.test(expiresAt)) {
      localStorage.setItem(EXPIRES_STORAGE_KEY, expiresAt);
    }

    if (token || expiresAt) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }

  function authorizationHeaders(extra = {}) {
    const token = getStoredToken();
    if (!token) return { ...extra };
    return { ...extra, Authorization: `Bearer ${token}` };
  }

  async function verifyStoredAccess() {
    importTokenFromUrlFragment();
    const token = getStoredToken();

    if (!token) {
      redirectToAccessGate();
      return false;
    }

    const storedExpiry = Number(localStorage.getItem(EXPIRES_STORAGE_KEY) || "0");
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (storedExpiry > 0 && storedExpiry <= nowSeconds) {
      clearAccessData();
      redirectToAccessGate();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "GET",
        headers: authorizationHeaders({ Accept: "application/json" }),
        cache: "no-store"
      });

      if (!response.ok) {
        clearAccessData();
        redirectToAccessGate();
        return false;
      }

      const verified = await response.json();
      if (verified.expires_at) {
        localStorage.setItem(EXPIRES_STORAGE_KEY, String(verified.expires_at));
      }
      return true;
    } catch (error) {
      console.error("Access verification failed:", error);
      clearAccessData();
      redirectToAccessGate();
      return false;
    }
  }

  function handleUnauthorizedResponse(response) {
    if (response && (response.status === 401 || response.status === 403)) {
      clearAccessData();
      redirectToAccessGate();
      return true;
    }
    return false;
  }

  window.ACCESS_GUARD = Object.freeze({
    verifyStoredAccess,
    getStoredToken,
    clearAccessData,
    redirectToAccessGate,
    authorizationHeaders,
    handleUnauthorizedResponse
  });
})();
