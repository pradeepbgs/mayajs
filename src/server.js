import net from "net";
import ResponseHandler from "./responseHandler.js";
import { createConnectionHandler } from "./handleConnection.js";

class Maya {
  constructor() {
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
    this.compiledMiddlewares = [];
    this.compiledRoutes = {};
  }

  compile() {
    this.compiledMiddlewares = Object.entries(this.middlewares).sort(([a], [b]) => b.length - a.length);

    for (const method in this.routes) {
      this.compiledRoutes[method] = Object.entries(this.routes[method]).sort(([a, routeA], [b, routeB]) => {
        // Prioritize important routes, then by path length
        if (routeA.isImportant && !routeB.isImportant) return -1;
        if (!routeA.isImportant && routeB.isImportant) return 1;
        return b.length - a.length;
      });
    }
  }

  listen(port = 3000, callback) {
    this.compile();
    const handleConnection = createConnectionHandler(this, this.isBodyParse);
    const server = net.createServer((socket) => handleConnection(socket));

    server.listen(port, () => {
      if (typeof callback === "function") {
        return callback();
      }
    });
  }

  use(pathORhandler, handler) {
    const path = typeof pathORhandler === "string" ? pathORhandler : "/";
    if (!this.middlewares[path]) {
      this.middlewares[path] = [];
    }
    this.middlewares[path].push(handler || pathORhandler);
  }

  bodyParse() {
    this.isBodyParse = true;
  }

  defineRoute(method, path) {
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
    return this.defineRoute("GET", path);
  }

  post(path) {
    return this.defineRoute("POST", path);
  }

  put(path) {
    return this.defineRoute("PUT", path);
  }

  delete(path) {
    return this.defineRoute("DELETE", path);
  }

  patch(path) {
    return this.defineRoute("PATCH", path);
  }
}

export default Maya;
