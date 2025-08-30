module.exports = {
  permalink: "sitemap.xml",
  eleventyExcludeFromCollections: true,
  data: { layout: null },
  render(data) {
    const baseUrl = (data.site && data.site.baseUrl) || "/";
    const deals = data.active_deals || [];
    const cats = data.categories || [];

    const abs = (p) => {
      if (!p) return baseUrl;
      if (/^https?:\/\//.test(p)) return p;
      return baseUrl.replace(/\/+$/, "") + "/" + String(p).replace(/^\/+/, "");
    };
    const iso = (s) => {
      if (!s) return "";
      const d = new Date(s);
      if (isNaN(d)) return "";
      return d.toISOString();
    };
    const slug = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    let out = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    out += `<url>\n<loc>${baseUrl}</loc>\n<changefreq>hourly</changefreq>\n</url>\n`;
    out += `<url>\n<loc>${abs("categories/")}</loc>\n</url>\n`;

    for (const d of deals) {
      out += `<url>\n<loc>${abs(`deal/${d.id}/`)}</loc>\n`;
      const lastmod = iso(d.verified_at || d.start_date);
      if (lastmod) out += `<lastmod>${lastmod}</lastmod>\n`;
      out += `</url>\n`;
    }

    for (const c of cats) {
      out += `<url>\n<loc>${abs(`category/${slug(c.name)}/`)}</loc>\n</url>\n`;
    }

    out += `</urlset>\n`;
    return out;
  }
};

