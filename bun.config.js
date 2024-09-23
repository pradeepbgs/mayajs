// bun.config.js
export default {
    entry: [
      "./src/server.js",
      "./src/router.js",
      "./src/trie.js",
      "./src/responseHandler.js",
      "./src/requestHandler.js",
      "./src/multipartFormDataParser.js",
      "./src/handleSocketConnection.js",
      "./src/errResponse.js",
      "./src/cache.js"
    ],
    outDir: "./build",
    minify: true,
  };
  