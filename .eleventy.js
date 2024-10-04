const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");


module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "edge",
    functionsDir: "serverless",
  });
};