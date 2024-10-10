const net = require("net");
const tls = require("node:tls");
const fs = require("fs");
const handleConnection = require("./handleSocketConnection.js");
const Trie = require("./trie.js");

const rateLimit = (props) => {
  const { time : windowMs, max, message } = props;
  const requests = new Map();
  
  return async (xl,socket) => {
    const currentTime = new Date();
    const socketIP = socket.remoteAddress;

    if (!requests.has(socketIP)) {
      requests.set(socketIP,{count:0,startTime:Date.now()})
    }

    const requestInfo = requests.get(socketIP)
    // check if windows time has passed
    if (currentTime-requestInfo.startTime > windowMs) {
      // it means set time of server has passed
      requestInfo.count=1;
      requestInfo.startTime=currentTime;
    } else {
      requestInfo.count++;
    }

    if(requestInfo.count > max){
      xl.json({error:message})
      return socket.end()
    }

   await xl.next()
  }
};



class Maya {
  constructor() {
    this.sslOptions = null;
    this.globalMidlleware = [];
    this.midllewares = new Map();
    this.compiledRoutes = {};
    this.corsConfig = null;
    this.staticFileServeLocation = null;
    this.trie = new Trie();
    this.hasMiddleware = false
  }

  async useHttps(options = {}) {
    if (options.keyPath && options.certPath) {
      try {
        this.sslOptions = {
          key: await fs.promises.readFile(options.keyPath),
          cert: await fs.promises.readFile(options.certPath),
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

  compile(){
    if (this.globalMidlleware.length > 0) {
      this.hasMiddleware=true
    }

    for (const [path,middlewares] of this.midllewares.entries()){
      if (middlewares.length>0) {
        this.hasMiddleware=true
        break;
      }
    }    
  }

  #createServer(handleConnection) {
    return this.sslOptions
      ? tls.createServer(this.sslOptions, (socket) =>
          handleConnection(socket, this)
        )
      : net.createServer((socket) => {
        handleConnection(socket, this)
      });
  }

  listen(port = 3000, callback) {
    this.compile()
    const server = this.#createServer(handleConnection);
    if (!server) {
      console.error("error while creating server");
    }
    // we are using setimmediate so it doesnt block the main thread
    setImmediate(() => {
      server.listen(port, () => {
        if (typeof callback === "function") return callback();
        console.log(
          `Server is running on ${
            this.sslOptions ? "https" : "http"
          }://localhost:${port}`
        );
      });
    });
    return server;
  }

  use(pathORhandler, handler) {
    if (typeof pathORhandler === "function") {
      if (!this.globalMidlleware.includes(pathORhandler)) {
        this.globalMidlleware.push(pathORhandler);
      }
      return;
    }

    const path = pathORhandler;

    if (!this.midllewares.has(path)) {
      this.midllewares.set(path, []);
    }

    const middlewareHandler = handler;
    if (!this.midllewares.get(path).includes(middlewareHandler)) {
      this.midllewares.get(path).push(middlewareHandler);
    }
  }

  // cors config

  cors(config) {
    this.corsConfig = config;
  }

  // set the path of serving static file
  serveStatic(path) {
    this.staticFileServeLocation = path;
  }

  async register(handlerInstance, pathPrefix = "") {
    const routeEntries = Object.entries(handlerInstance.trie.root.children);
    handlerInstance.trie.root.subMiddlewares.forEach((middleware,path)=>{
      if (!this.midllewares.has(pathPrefix+path)) {
        this.midllewares.set(pathPrefix+path, []);
      } 
      if (!this.midllewares.get(pathPrefix+path).includes(...middleware)) {
        this.midllewares.get(pathPrefix+path).push(...middleware);
      }
    })
    for (const [routeKey, routeNode] of routeEntries) {
      const fullpath = pathPrefix + routeNode?.path;
      const routeHandler = routeNode.handler[0];
      const httpMethod = routeNode.method[0];
      this.trie.insert(fullpath, { handler: routeHandler, method: httpMethod });
    }
    handlerInstance.trie = new Trie();
  }

  #defineRoute(method, path) {
    const chain = {
      handler: (...handlers) => {
        if (!this.midllewares.has(path)) {
          this.midllewares.set(path, []);
        }        
        const middlewareHandlers = handlers.slice(0, -1);
        if (path === "/") {
          if (!this.globalMidlleware.includes(...middlewareHandlers)) {
            this.globalMidlleware.push(...middlewareHandlers);
          }
        } else {
          if (!this.midllewares.get(path).includes(...middlewareHandlers)) {
            this.midllewares.get(path).push(...middlewareHandlers);
          }
        }
        const handler = handlers[handlers.length - 1];
        this.trie.insert(path, { handler, method });
      },
    };
    return chain;
  }

  #addMiddlewareAndHandler(method, path, handlers) {
    if (!this.midllewares.has(path)) {
      this.midllewares.set(path, []);
    }    
    const middlewareHandlers = handlers.slice(0, -1);
    if (path === "/") {
      if (!this.globalMidlleware.includes(...middlewareHandlers)) {
        this.globalMidlleware.push(...middlewareHandlers);
      }
    } else {
      if (!this.midllewares.get(path).includes(...middlewareHandlers)) {
        this.midllewares.get(path).push(...middlewareHandlers);
      }
    }

    const handler = handlers[handlers.length - 1];
    return this.trie.insert(path, { handler, method });
  }

  get(path, ...handlers) {
    if (handlers.length > 0) {
      return this.#addMiddlewareAndHandler("GET", path, handlers);
    }
    return this.#defineRoute("GET", path);
  }

  post(path, ...handlers) {
    if (handlers.length > 0) {
      return this.#addMiddlewareAndHandler("POST", path, handlers);
    }
    return this.#defineRoute("POST", path);
  }

  put(path, ...handlers) {
    if (handlers.length > 0) {
      return this.#addMiddlewareAndHandler("PUT", path, handlers);
    }
    return this.#defineRoute("PUT", path);
  }

  patch(path, ...handlers) {
    if (handlers.length > 0) {
      return this.#addMiddlewareAndHandler("PATCH", path, handlers);
    }
    return this.#defineRoute("PATCH", path);
  }

  delete(path, ...handlers) {
    if (handlers.length > 0) {
      return this.#addMiddlewareAndHandler("DELETE", path, handlers);
    }
    return this.#defineRoute("DELETE", path);
  }
}

module.exports = {
  Maya,
  rateLimit
};
