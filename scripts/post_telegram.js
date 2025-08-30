// scripts/post_telegram.js
// Posts today's deals to a Telegram channel using Bot API.
// Requires env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// Reads src/_data/active_deals.json (created by fetch_deals) or falls back to src/_data/deals.json.

const fs = require("fs").promises;
const path = require("path");

function bdToday() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 60 * 60000); // UTC+6
  const y = bd.getUTCFullYear();
  const m = String(bd.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bd.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function esc(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage(token, chatId, html) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: false
    })
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error("Telegram error: " + JSON.stringify(data));
  }
  return data;
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");

  const activePath = path.join(process.cwd(), "src", "_data", "active_deals.json");
  const dealsPath = path.join(process.cwd(), "src", "_data", "deals.json");
  let deals = [];
  try {
    const raw = await fs.readFile(activePath, "utf8");
    deals = JSON.parse(raw);
  } catch {
    const raw = await fs.readFile(dealsPath, "utf8");
    deals = JSON.parse(raw);
  }

  const today = bdToday();
  let picks = deals.filter(d => (d.verified_at || "").startsWith(today));
  if (picks.length === 0) picks = deals.filter(d => d.is_featured);
  if (picks.length === 0 && deals.length > 0) picks = [deals[0]];
  if (picks.length === 0) {
    console.log("No deals to post.");
    return;
  }

  picks = picks.slice(0, 3);

  for (const d of picks) {
    const url = d.affiliate_link && d.affiliate_link !== "" ? d.affiliate_link : d.raw_link;
    const title = esc(d.title_bn || d.title_en || d.id);
    const merchant = esc(d.merchant || "");
    const cat = esc(d.category || "");
    const pay = esc(d.payment_methods || "");
    const save = esc(d.savings_text || "");
    const btn = url ? `👉 <a href="${esc(url)}">ডিল দেখুন</a>` : "";
    const tags = [merchant ? `#${merchant.replace(/\s+/g, "")}` : "", cat ? `#${cat}` : ""].filter(Boolean).join(" ");

    const html =
      `<b>${title}</b>\n` +
      (save ? `${save}\n` : "") +
      (merchant ? `Merchant: ${merchant}\n` : "") +
      (pay ? `Payment: ${pay}\n` : "") +
      `${btn}\n` +
      `${tags}`;

    console.log("Posting:", title);
    await sendMessage(token, chatId, html);
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log("Posted", picks.length, "deal(s) to Telegram.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

