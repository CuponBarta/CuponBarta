module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
—--------------------
Package(): 

{
  "name": "cuponbarta",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "eleventy",
    "start": "eleventy --serve"
  },
  "devDependencies": {}
}
