module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("limit", (arr, n) => Array.isArray(arr) ? arr.slice(0, n) : []);
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    if (!base) return path || "/";
    if (!path) return base;
    if (path.startsWith("http")) return path;
    return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
  });
  eleventyConfig.addFilter("slugify", (str) =>
    (str || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  );
  eleventyConfig.addFilter("rfc822", (str) => {
    const d = str ? new Date(str) : new Date();
    return d.toUTCString();
  });
  eleventyConfig.addFilter("isoDate", (str) => {
    const d = str ? new Date(str) : new Date();
    return d.toISOString();
  });
  eleventyConfig.addCollection("activeDeals", (api) => {
    const deals = api.globalData.deals || [];
    const now = new Date();
    const active = deals.filter(d => {
      if (d.status && String(d.status).toLowerCase() !== "active") return false;
      if (d.expiry_date) {
        const dt = new Date(d.expiry_date);
        if (!isNaN(dt) && dt < now) return false;
      }
      return true;
    });
    active.sort((a,b) => (b.verified_at || b.start_date || "").localeCompare(a.verified_at || a.start_date || ""));
    return active;
  });
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
