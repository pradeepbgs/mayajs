import net from "net";
import tls from "tls";
import fs from "fs";

import { createConnectionHandler } from "./handleConnection.js";
import Trie from "./trie.js";

class Maya {
  constructor() {
    this.sslOptions = null;
    // this.routes = {
    //   GET: {},
    //   POST: {},
    //   PUT: {},
    //   DELETE: {},
    //   PATCH: {},
    // };
    this.middlewares = {};
    this.isBodyParse = false;
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

  // since we already inserting path and handler in defineRoute func
  // #compile() {
  //   for (const method in this.routes) {
  //     for (const [path, route] of Object.entries(this.routes[method])) {
  //       this.trie.insert(path, route);
  //     }
  //   }

  //   Object.assign(this.routes, {
  //     GET: {},
  //     POST: {},
  //     PUT: {},
  //     DELETE: {},
  //     PATCH: {},
  //   });
  // }

  #createServer(handleConnection) {
    return this.sslOptions
      ? tls.createServer(this.sslOptions, (socket) => handleConnection(socket))
      : net.createServer((socket) => handleConnection(socket));
  }

  async listen(port = 3000, callback) {
    // this.#compile();
    // Object.assign(this.routes, {
    //   GET: {},
    //   POST: {},
    //   PUT: {},
    //   DELETE: {},
    //   PATCH: {},
    // });
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

  // set the path of serving static file
  serveStatic(path){
    this.staticFileServeLocation = path;
  }

  #defineRoute(method, path) {
    let isImportant = false;
    const chain = {
      isImportant: () => {
        isImportant = true;
        return chain;
      },
      handler: (...handler) => {
        this.middlewares[path] = this.middlewares[path] || [];
        for(let i =0; i<handler.length-1;i++){
          this.middlewares[path].push(handler[i])
        }
        handler = handler[handler.length-1];
        this.trie.insert(path, { handler, isImportant, method })
      }
    };
    return chain;
  }

  
  register(handlerInstance, pathPrefix = "") {
    const h = Object.entries(handlerInstance.trie.root.children)
    for (const [key , val] of h) {
      const fullpath = pathPrefix+val?.path;
      const handler = val.handler;
      const isImportant = val.isImportant
      const method = val.method;
      this.trie.insert(fullpath,{handler,isImportant,method})
    }
    handlerInstance.trie = new Trie();
  }

  // #joinPaths(...paths) {
  //   return '/' + paths.map(path => path.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
  // }
  
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
