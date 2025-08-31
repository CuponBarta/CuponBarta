module.exports = {
  permalink: "feed-mailchimp.xml",
  eleventyExcludeFromCollections: true,
  data: { layout: null },
  render(data) {
    const baseUrl = (data.site && data.site.baseUrl) || "/";
    const deals = (data.active_deals || []).slice(0, 20);

    const abs = (p) => {
      if (!p) return baseUrl;
      if (/^https?:\/\//.test(p)) return p;
      return baseUrl.replace(/\/+$/, "") + "/" + String(p).replace(/^\/+/, "");
    };
    const rfc822 = (s) => {
      const d = s ? new Date(s) : new Date();
      return d.toUTCString();
    };

    let out = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n`;
    out += `<title>${data.site?.brand || "CuponBarta"} — Deals</title>\n`;
    out += `<link>${baseUrl}</link>\n`;
    out += `<description>Latest verified deals and coupons for Bangladesh (bKash/Nagad friendly).</description>\n`;
    out += `<language>bn-BD</language>\n`;

    for (const d of deals) {
      const url = abs(`deal/${d.id}/`);
      const title = d.title_en || d.title_bn || d.id;
      const desc = (d.description_bn || "").replace(/]]>/g, "]]&gt;");
      const pub = rfc822(d.verified_at || d.start_date);
      out += `<item>\n<title>${title}</title>\n<link>${url}</link>\n<guid isPermaLink="true">${url}</guid>\n<pubDate>${pub}</pubDate>\n<description><![CDATA[ ${desc} ]]></description>\n</item>\n`;
    }

    out += `</channel>\n</rss>\n`;
    return out;
  }
};
