// scripts/fetch_deals.js
// Reads Google Sheets CSV and produces Eleventy data JSONs for CuponBarta.
// Ethics/TOS: only public offer data from your Sheet. No private/scraped data.

const fs = require("fs").promises;
const path = require("path");
const { parse } = require("csv-parse/sync");

function titleize(s) {
  if (!s) return "";
  return s.toString().replace(/[-_]+/g, " ").replace(/\s+/g, " ")
    .trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function boolify(v) {
  const s = (v || "").toString().trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}
function isoDateOrBlank(v) {
  const s = (v || "").toString().trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`; // YYYY-MM-DD only
  return "";
}
function todayYMD() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const cfgRaw = await fs.readFile(path.join(process.cwd(), "config.json"), "utf8");
  const cfg = JSON.parse(cfgRaw);
  const sheetCsvUrl = cfg.sheetCsvUrl;
  if (!sheetCsvUrl) {
    throw new Error("config.json: sheetCsvUrl missing.");
  }
  // Accept both published link formats:
  // - .../pub?gid=...&single=true&output=csv
  // - .../export?format=csv&gid=...
  const isCsv = sheetCsvUrl.includes("output=csv") || sheetCsvUrl.includes("export?format=csv");
  if (!isCsv) {
    console.warn("Warning: sheetCsvUrl may not be a CSV link. Attempting fetch anyway...");
  }

  console.log("Fetching CSV:", sheetCsvUrl);
  const res = await fetch(sheetCsvUrl);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();

  const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true });
  const seen = new Set();
  const today = todayYMD();

  const normalized = rows.map(r => {
    const obj = {};
    for (const k in r) obj[k] = (r[k] || "").toString().trim();

    const n = {
      id: obj.id || "",
      title_bn: obj.title_bn || "",
      title_en: obj.title_en || "",
      merchant: obj.merchant || "",
      merchant_site: obj.merchant_site || "",
      category: (obj.category || "").toLowerCase().trim() || "other",
      tags: obj.tags || "",
      description_bn: obj.description_bn || "",
      country: obj.country || "BD",
      raw_link: obj.raw_link || "",
      affiliate_network: obj.affiliate_network || "",
      affiliate_program: obj.affiliate_program || "",
      affiliate_link: (obj.affiliate_link || "").toString().trim(),
      code: obj.code || "",
      discount_type: obj.discount_type || "",
      savings_text: obj.savings_text || "",
      min_spend_bdt: obj.min_spend_bdt || "",
      payment_methods: obj.payment_methods || "",
      start_date: isoDateOrBlank(obj.start_date),
      expiry_date: isoDateOrBlank(obj.expiry_date),
      is_featured: boolify(obj.is_featured),
      status: (obj.status || "active").toLowerCase(),
      verified_at: isoDateOrBlank(obj.verified_at),
      image: obj.image || ""
    };
    if (n.affiliate_link.toUpperCase() === "TBD") n.affiliate_link = "";
    return n;
  }).filter(d => {
    if (!d.id) return false;
    if (seen.has(d.id)) return false;
    seen.add(d.id);

    if (d.status !== "active") return false;

    if (d.expiry_date && d.expiry_date < today) return false;

    return true;
  });

  normalized.sort((a, b) => {
    const ad = a.verified_at || a.start_date || "";
    const bd = b.verified_at || b.start_date || "";
    return bd.localeCompare(ad);
  });

  const catSet = new Set();
  const catMap = {};
  for (const d of normalized) {
    catSet.add(d.category);
    if (!catMap[d.category]) catMap[d.category] = [];
    catMap[d.category].push(d.id);
  }
  const categories = Array.from(catSet).sort().map(name => ({ name, title: titleize(name) }));

  const dataDir = path.join(process.cwd(), "src", "_data");
  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(path.join(dataDir, "deals.json"), JSON.stringify(normalized, null, 2) + "\n");
  await fs.writeFile(path.join(dataDir, "categories.json"), JSON.stringify(categories, null, 2) + "\n");
  await fs.writeFile(path.join(dataDir, "categories_map.json"), JSON.stringify(catMap, null, 2) + "\n");

  console.log(`Wrote ${normalized.length} active deals, ${categories.length} categories.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
