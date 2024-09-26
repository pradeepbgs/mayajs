const net = require("net");
const tls = require("node:tls");
const fs = require("fs");
const handleConnection = require("./handleSocketConnection.js");
const Trie = require("./trie.js");

class Maya {
  constructor() {
    this.sslOptions = null;
    this.globalMidlleware = [];
    this.middlewares = new Map();
    this.compiledRoutes = {};
    this.corsConfig = null;
    this.staticFileServeLocation = null;
    this.trie = new Trie();
  }

  async useHttps(options = {}) {
    if (options.keyPath && options.certPath) {
      try {
        this.sslOptions = {
          key: await fs.readFileSync(options.keyPath),
          cert: await fs.readFileSync(options.certPath),
        };
      } catch (error) {
        console.error("Error reading SSL certificate or key:", error);
        this.sslOptions = null;
      }
    } else {
      console.warn("SSL options not provided. Server will default to HTTP.");
      this.sslOptions = null;
    }
  }

 

  #createServer(handleConnection) {
    return this.sslOptions
      ? tls.createServer(this.sslOptions, (socket) => handleConnection(socket, this))
      : net.createServer((socket) => handleConnection(socket, this));
  }

  listen(port = 3000, callback) {
    const server = this.#createServer(handleConnection);
    if (!server) {
      console.error("error while creating server")
    }
    server.listen(port, () => {
      if (typeof callback === "function") return callback();
      console.log(`Server is running on ${this.sslOptions ? "https" : "http"}://localhost:${port}`);
    });
    return server;
  }

  use(pathORhandler, handler) {

    if (typeof pathORhandler === 'function') {
      if (!this.globalMidlleware.includes(pathORhandler)) {
        this.globalMidlleware.push(pathORhandler);
      }
      return;
    }

    const path = pathORhandler
   
    if (!this.middlewares.has(path)) {
      this.middlewares.set(path,[])
    }

    const middlewareHandler = handler;
    if (!this.middlewares.get(path).includes(middlewareHandler)) {
      this.middlewares.get(path).push(middlewareHandler)
    }
  }

  // cors config

  cors(config) {
    this.corsConfig = config;
  }

  // set the path of serving static file
  // serveStatic(path) {
  //   this.staticFileServeLocation = path;
  // }

  async register(handlerInstance, pathPrefix = "") {
    const routeEntries = Object.entries(handlerInstance.trie.root.children);
    for (const [routeKey, routeNode] of routeEntries) {
      const fullpath = pathPrefix + routeNode?.path;
      const routeHandler = routeNode.handler[0];
      const httpMethod = routeNode.method[0];
      this.trie.insert(fullpath, { handler:routeHandler, method:httpMethod});
    }
    handlerInstance.trie = new Trie();
  }

  #defineRoute(method, path) {
    const chain = {
      handler: (...handlers) => {
        this.middlewares[path] = this.middlewares[path] || [];
        const middlewareHandlers = handlers.slice(0, -1);

        this.middlewares[path].push(...middlewareHandlers)

        const handler = handlers[handlers.length - 1];
        this.trie.insert(path, { handler, method });
      },
    };
    return chain;
  }

  get(path) {
    return this.#defineRoute("GET", path);
  }

  post(path) {
    return this.#defineRoute("POST", path);
  }

  put(path) {
    return this.#defineRoute("PUT", path);
  }

  delete(path) {
    return this.#defineRoute("DELETE", path);
  }

  patch(path) {
    return this.#defineRoute("PATCH", path);
  }
}

module.exports = Maya;
