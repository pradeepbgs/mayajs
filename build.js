// bun.config.js
await Bun.build({

  entrypoints: [
    "./src/server.js",
      "./src/router.js",
      "./src/trie.js",
      // "./src/responseHandler.js",
      "./src/requestHandler.js",
      "./src/multipartFormDataParser.js",
      "./src/handleSocketConnection.js",
      "./src/errResponse.js",
      "./src/cache.js"
    ],
    outDir: "./dist",
    minify: true,
})
  