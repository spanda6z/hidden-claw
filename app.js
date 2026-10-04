// HIDDEN CLAW — product client + Solana payment + live prices

const TREASURY = "YOUR_TREASURY_WALLET_ADDRESS_HERE";
const ACCESS_PRICE_SOL = 3;
const RPC = "https://api.mainnet-beta.solana.com";

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

function getProvider() {
  if ("solana" in window) {
    const provider = window.solana;
    if (provider.isPhantom) return provider;
  }
  window.open("https://phantom.app/", "_blank");
  return null;
}

async function handlePay() {
  const provider = getProvider();
  if (!provider) {
    alert("Phantom wallet is required. Install it and try again.");
    return;
  }

  try {
    const resp = await provider.connect();
    const fromPubkey = resp.publicKey;

    const paidKey = "hiddenclaw_paid_" + fromPubkey.toString();
    if (localStorage.getItem(paidKey) === "true") {
      alert("Access already unlocked for this wallet.");
      window.location.href = "/screener/";
      return;
    }

    if (TREASURY === "YOUR_TREASURY_WALLET_ADDRESS_HERE") {
      alert("Treasury address not configured.\n\nOpen app.js and replace TREASURY with your Solana wallet address, then redeploy.");
      return;
    }

    const connection = new solanaWeb3.Connection(RPC, "confirmed");
    const toPubkey = new solanaWeb3.PublicKey(TREASURY);
    const lamports = ACCESS_PRICE_SOL * solanaWeb3.LAMPORTS_PER_SOL;

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signed = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, "confirmed");

    localStorage.setItem(paidKey, "true");
    localStorage.setItem("hiddenclaw_wallet", fromPubkey.toString());

    alert("Payment confirmed.\nSignature: " + signature + "\n\nAccess unlocked.");
    window.location.href = "/screener/";
  } catch (err) {
    console.error(err);
    alert("Payment failed: " + (err.message || err));
  }
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

document.addEventListener("DOMContentLoaded", () => {
  injectLogos();
  renderLiveItems();
  renderStats();
  fetchPrices();
  setInterval(fetchPrices, 30000);

  document.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.addEventListener("click", handlePay);
  });
});
