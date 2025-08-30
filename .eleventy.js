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
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};

