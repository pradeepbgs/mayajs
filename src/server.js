import net from "net";
import tls from "tls";
import fs from "fs";

import ResponseHandler from "./responseHandler.js";
import { createConnectionHandler } from "./handleConnection.js";
import Trie from "./trie.js";

class Maya {
  constructor() {
    this.sslOptions = null;
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
      PATCH: {},
    };
    this.middlewares = {};
    this.ResponseHandler = ResponseHandler;
    this.isBodyParse = false;
    this.compiledRoutes = {};
    this.corsConfig = null;
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

  #compile() {
    for (const method in this.routes) {
      for (const [path, route] of Object.entries(this.routes[method])) {
        this.trie.insert(path, route);
      }
    }

    Object.assign(this.routes, {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
      PATCH: {},
    });
  }

  #createServer(handleConnection) {
    return this.sslOptions
      ? tls.createServer(this.sslOptions, (socket) => handleConnection(socket))
      : net.createServer((socket) => handleConnection(socket));
  }

  async listen(port = 3000, callback) {
    this.#compile();
    const handleConnection = createConnectionHandler(this, this.isBodyParse);

    const server = this.#createServer(handleConnection);

    server.listen(port, () => {
      if (typeof callback === "function") return callback();
      console.log(`Server is running on ${this.sslOptions ? "https" : "http"}://localhost:${port}`);
    });
    return server;
  }

  use(pathORhandler, handler) {
    const path = typeof pathORhandler === "string" ? pathORhandler : "/";
    this.middlewares[path] = this.middlewares[path] || [];
    this.middlewares[path].push(handler || pathORhandler);
  }

  // cors config

  cors(config){
    this.corsConfig = config;
  }

  // Enables body parsing for the server.
  bodyParse() {
    this.isBodyParse = true;
  }

  #defineRoute(method, path) {
    let isImportant = false;
    const chain = {
      isImportant: () => {
        isImportant = true;
        return chain;
      },

      handler: (handler) => {
        this.routes[method][path] = { handler, isImportant };
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

export default Maya;
