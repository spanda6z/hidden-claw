// HIDDEN CLAW — product client + live prices + auth helpers

const liveExamples = [
  { name: "SI", note: "Its creator has 3+ earlier launches", time: "14s" },
  { name: "Edgar", note: "Raised 0.90 SOL", time: "14s" },
  { name: "MAPI", note: "Its creator has 3+ earlier launches", time: "14s" },
  { name: "HIVE", note: "Raised 1.51 SOL", time: "14s" },
  { name: "SCRONK", note: "Its creator has 3+ earlier launches", time: "14s" },
  { name: "VOID", note: "Raised 2.10 SOL", time: "22s" },
  { name: "CLAW", note: "Its creator has 3+ earlier launches", time: "31s" },
];

function renderLiveItems() {
  const container = document.getElementById("live-items");
  if (!container) return;
  container.innerHTML = liveExamples
    .map((item) => `<div class="live-item"><strong>${item.name}</strong> ${item.note}, queued for a scan ${item.time}</div>`)
    .join("");
}

function renderStats() {
  const map = {
    "launches-today": "1,549",
    "scans-today": "169",
    "wallets-record": "118,749",
    "online-now": "1",
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

async function fetchPrices() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
    );
    if (!res.ok) return;
    const data = await res.json();
    updateTicker("sol", data.solana);
    updateTicker("btc", data.bitcoin);
    updateTicker("eth", data.ethereum);
  } catch (e) {
    console.warn("Price fetch failed", e);
  }
}

function updateTicker(key, info) {
  if (!info) return;
  const priceEl = document.getElementById(`price-${key}`);
  const changeEl = document.getElementById(`change-${key}`);
  if (!priceEl || !changeEl) return;

  const price = info.usd;
  const change = info.usd_24h_change || 0;

  if (key === "btc") {
    priceEl.textContent = "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else {
    priceEl.textContent = "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const sign = change >= 0 ? "+" : "";
  changeEl.textContent = sign + change.toFixed(2) + "%";
  changeEl.className = "ticker-change " + (change >= 0 ? "up" : "down");
}

const LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
  <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

function injectLogos() {
  document.querySelectorAll(".logo-mark").forEach((el) => {
    el.innerHTML = LOGO_SVG;
  });
}

function isAuthenticated() {
  return localStorage.getItem("hiddenclaw_auth") === "1" || sessionStorage.getItem("hiddenclaw_auth") === "1";
}

function getUser() {
  return localStorage.getItem("hiddenclaw_user") || sessionStorage.getItem("hiddenclaw_user");
}

document.addEventListener("DOMContentLoaded", () => {
  injectLogos();
  renderLiveItems();
  renderStats();
  fetchPrices();
  setInterval(fetchPrices, 30000);

  const user = getUser();
  if (user) {
    document.querySelectorAll(".nav-auth, a[href*='auth']").forEach((el) => {
      if (el.textContent.trim() === "Sign in") {
        el.textContent = user.split("@")[0];
      }
    });
  }
});
