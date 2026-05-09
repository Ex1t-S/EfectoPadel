const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "expo-router/_ctx.web") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "src/router-ctx.web.js")
    };
  }

  if (platform === "web" && moduleName === "expo-router/_ctx") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "src/router-ctx.web.js")
    };
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
